import crypto from "crypto"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

type CreemWebhookPayload = {
  type?: string
  event_type?: string
  data?: {
    status?: string
    metadata?: Record<string, unknown>
    object?: {
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

const planIsPro = (plan: string) =>
  ["pro", "team", "enterprise", "studio", "vip"].includes(plan.toLowerCase())

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

  const canceledStatuses = ["canceled", "cancelled", "expired", "past_due", "unpaid"]
  const isCanceledEvent = eventType.includes("cancel") || eventType.includes("expire")
  const isActive = !canceledStatuses.includes(status) && !isCanceledEvent
  const isProMember = planIsPro(planNormalized) && isActive

  const admin = createAdminClient()
  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId)
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const existingMetadata = userData.user.user_metadata || {}
  const nextMetadata = {
    ...existingMetadata,
    plan: planNormalized || existingMetadata.plan,
    cycle: toStringValue(metadata.cycle) || existingMetadata.cycle,
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

  return NextResponse.json({ ok: true })
}
