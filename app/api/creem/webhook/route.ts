import crypto from "crypto"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

type CreemWebhookPayload = {
  type?: string
  id?: string
  event_type?: string
  data?: {
    id?: string
    status?: string
    metadata?: Record<string, unknown>
    object?: {
      id?: string
      status?: string
      metadata?: Record<string, unknown>
    }
    customer?: {
      email?: string
      metadata?: Record<string, unknown>
    }
  }
  metadata?: Record<string, unknown>
}

const readSignature = (headers: Headers) =>
  headers.get("creem-signature") || headers.get("x-creem-signature") || ""

const normalizeSignature = (value: string) => value.replace(/^sha256=/i, "").trim()

const verifySignature = (secret: string, rawBody: string, signature: string) => {
  if (!secret || !signature) {
    return false
  }
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(normalizeSignature(signature)))
}

const toStringValue = (value: unknown) => (typeof value === "string" ? value : "")

const pickMetadata = (payload: CreemWebhookPayload) =>
  payload.data?.metadata ?? payload.data?.object?.metadata ?? payload.metadata ?? {}

const pickStatus = (payload: CreemWebhookPayload) => {
  const status = payload.data?.status ?? payload.data?.object?.status ?? ""
  return toStringValue(status).toLowerCase()
}

const pickEventType = (payload: CreemWebhookPayload) => {
  const event = payload.type ?? payload.event_type ?? ""
  return toStringValue(event).toLowerCase()
}

const pickEventId = (payload: CreemWebhookPayload, rawBody: string) => {
  const fallback = crypto.createHash("sha256").update(rawBody).digest("hex")
  return (
    toStringValue(payload.data?.object?.id) ||
    toStringValue(payload.data?.id) ||
    toStringValue(payload.id) ||
    fallback
  )
}

const planIsPro = (plan: string) =>
  ["pro", "team", "enterprise", "studio", "vip"].includes(plan.toLowerCase())

const PLAN_CREDITS: Record<
  string,
  {
    monthly: number
    yearly: number
  }
> = {
  starter: { monthly: 200, yearly: 2400 },
  pro: { monthly: 800, yearly: 9600 },
  team: { monthly: 3600, yearly: 43200 },
}

const PACK_CREDITS: Record<string, number> = {
  "starter-pack": 500,
  "growth-pack": 1500,
  "professional-pack": 3600,
  "enterprise-pack": 15000,
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const secret = process.env.CREEM_WEBHOOK_SECRET
  const signature = readSignature(req.headers)

  if (secret && !verifySignature(secret, rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 })
  }

  let payload: CreemWebhookPayload | null = null
  try {
    payload = JSON.parse(rawBody) as CreemWebhookPayload
  } catch (err) {
    console.warn("Failed to parse Creem webhook payload", err)
  }

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }

  const metadata = pickMetadata(payload)
  const userId =
    toStringValue(metadata.user_id) ||
    toStringValue(metadata.userId) ||
    toStringValue(payload.data?.customer?.metadata?.user_id) ||
    toStringValue(payload.data?.customer?.metadata?.userId)

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id metadata." }, { status: 400 })
  }

  const planRaw = toStringValue(metadata.plan)
  const planNormalized = planRaw.toLowerCase()
  const status = pickStatus(payload)
  const eventType = pickEventType(payload)
  const eventId = pickEventId(payload, rawBody)
  const cycle = toStringValue(metadata.cycle) || "monthly"
  const packId = toStringValue(metadata.pack)

  const canceledStatuses = ["canceled", "cancelled", "expired", "past_due", "unpaid"]
  const isCanceledEvent = eventType.includes("cancel") || eventType.includes("expire")
  const isActive = !canceledStatuses.includes(status) && !isCanceledEvent
  const isProMember = planIsPro(planNormalized) && isActive
  const isSuccessStatus = ["paid", "succeeded", "completed", "active"].includes(status)
  const isSuccessEvent =
    eventType.includes("paid") || eventType.includes("payment") || eventType.includes("checkout")
  const shouldGrant = isActive && (isSuccessStatus || isSuccessEvent)

  const admin = createAdminClient()
  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId)
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const existingMetadata = userData.user.user_metadata || {}
  const nextMetadata = {
    ...existingMetadata,
    plan: planNormalized || existingMetadata.plan,
    cycle: cycle || existingMetadata.cycle,
    subscription_status: status || existingMetadata.subscription_status,
    isProMember,
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: nextMetadata,
  })

  if (updateError) {
    console.error("Failed to update user metadata from Creem webhook", updateError)
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 })
  }

  if (shouldGrant) {
    const now = new Date()
    if (packId && PACK_CREDITS[packId]) {
      const credits = PACK_CREDITS[packId]
      const { error: packError } = await admin.from("credit_grants").upsert(
        {
          user_id: userId,
          source: "credit-pack",
          plan_id: packId,
          cycle: null,
          credits_total: credits,
          credits_remaining: credits,
          expires_at: null,
          source_event_id: `${eventId}:pack`,
        },
        { onConflict: "source_event_id" }
      )
      if (packError) {
        console.error("Failed to grant pack credits", packError)
      }
    }

    if (planNormalized && PLAN_CREDITS[planNormalized]) {
      const planCredits = PLAN_CREDITS[planNormalized]
      const credits = cycle === "yearly" ? planCredits.yearly : planCredits.monthly
      const expiresAt = new Date(now)
      if (cycle === "yearly") {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      }
      const { error: planError } = await admin.from("credit_grants").upsert(
        {
          user_id: userId,
          source: "subscription",
          plan_id: planNormalized,
          cycle,
          credits_total: credits,
          credits_remaining: credits,
          expires_at: expiresAt.toISOString(),
          source_event_id: `${eventId}:subscription`,
        },
        { onConflict: "source_event_id" }
      )
      if (planError) {
        console.error("Failed to grant subscription credits", planError)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
