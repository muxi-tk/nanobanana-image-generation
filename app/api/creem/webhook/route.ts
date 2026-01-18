import crypto from "crypto"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

type CreemWebhookPayload = {
  type?: string
  id?: string
  eventId?: string
  event_id?: string
  eventType?: string
  event_type?: string
  created_at?: number
  data?: {
    id?: string
    status?: string
    metadata?: Record<string, unknown>
    object?: {
      id?: string
      status?: string
      metadata?: Record<string, unknown>
      checkout?: {
        metadata?: Record<string, unknown>
      }
      subscription?: {
        id?: string
        metadata?: Record<string, unknown>
      }
      order?: {
        id?: string
        amount?: number
        currency?: string
      }
      transaction?: {
        id?: string
        amount?: number
        amount_paid?: number
        currency?: string
      }
      product?: {
        price?: number
        currency?: string
      }
      subscription?: {
        id?: string
      }
      customer?: {
        email?: string
        id?: string
        metadata?: Record<string, unknown>
      }
    }
    customer?: {
      email?: string
      metadata?: Record<string, unknown>
    }
  }
  object?: {
    id?: string
    status?: string
    metadata?: Record<string, unknown>
    checkout?: {
      metadata?: Record<string, unknown>
    }
    subscription?: {
      id?: string
      metadata?: Record<string, unknown>
    }
    order?: {
      id?: string
      amount?: number
      currency?: string
    }
    transaction?: {
      id?: string
      amount?: number
      amount_paid?: number
      currency?: string
    }
    product?: {
      price?: number
      currency?: string
    }
    subscription?: {
      id?: string
    }
    customer?: {
      email?: string
      id?: string
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

const toStringOrNull = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null)

const pickMetadata = (payload: CreemWebhookPayload) =>
  payload.data?.metadata ??
  payload.data?.object?.metadata ??
  payload.data?.object?.subscription?.metadata ??
  payload.data?.object?.checkout?.metadata ??
  payload.object?.metadata ??
  payload.object?.subscription?.metadata ??
  payload.object?.checkout?.metadata ??
  payload.metadata ??
  {}

const pickCustomerEmail = (payload: CreemWebhookPayload) =>
  toStringValue(payload.data?.customer?.email) ||
  toStringValue(payload.data?.object?.customer?.email) ||
  toStringValue(payload.object?.customer?.email)

const pickStatus = (payload: CreemWebhookPayload) => {
  const status = payload.data?.status ?? payload.data?.object?.status ?? payload.object?.status ?? ""
  return toStringValue(status).toLowerCase()
}

const pickEventType = (payload: CreemWebhookPayload) => {
  const event = payload.eventType ?? payload.type ?? payload.event_type ?? ""
  return toStringValue(event).toLowerCase()
}

const pickProductId = (payload: CreemWebhookPayload) =>
  toStringOrNull(payload.data?.object?.product_id) ||
  toStringOrNull(payload.data?.object?.product?.id) ||
  toStringOrNull(payload.data?.object?.checkout?.product_id) ||
  toStringOrNull(payload.data?.object?.checkout?.product?.id) ||
  toStringOrNull(payload.object?.product_id) ||
  toStringOrNull(payload.object?.product?.id) ||
  toStringOrNull(payload.object?.checkout?.product_id) ||
  toStringOrNull(payload.object?.checkout?.product?.id)

const pickEventId = (payload: CreemWebhookPayload, rawBody: string) => {
  const fallback = crypto.createHash("sha256").update(rawBody).digest("hex")
  return (
    toStringValue(payload.id) ||
    toStringValue(payload.eventId) ||
    toStringValue(payload.event_id) ||
    toStringValue(payload.data?.id) ||
    toStringValue(payload.data?.object?.id) ||
    toStringValue(payload.object?.id) ||
    fallback
  )
}

const SUCCESS_STATUSES = new Set(["paid", "succeeded", "completed"])
const FAILURE_STATUSES = new Set(["payment_failed", "failed", "unpaid"])
const SUCCESS_EVENT_HINTS = [
  "paid",
  "payment.succeeded",
  "payment_succeeded",
  "invoice.paid",
  "charge.succeeded",
]
const FAILURE_EVENT_HINTS = [
  "payment_failed",
  "payment.failed",
  "invoice.payment_failed",
  "charge.failed",
  "unpaid",
]
const matchesEventHint = (eventType: string, hint: string) => {
  if (!eventType) {
    return false
  }
  if (hint.includes(".")) {
    return eventType.includes(hint)
  }
  const escaped = hint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const tokenRegex = new RegExp(`(^|[._-])${escaped}($|[._-])`)
  return tokenRegex.test(eventType)
}

const pickObject = (payload: CreemWebhookPayload) =>
  payload.data?.object ?? payload.object ?? payload.data ?? null

const toNumberOrNull = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  return null
}

const resolvePurchaseDetails = (payload: CreemWebhookPayload) => {
  const metadata = pickMetadata(payload)
  const planRaw = toStringValue(metadata.plan)
  const cycleRaw = toStringValue(metadata.cycle)
  const packId = toStringValue(metadata.pack)
  if (planRaw || cycleRaw || packId) {
    return {
      plan: planRaw ? planRaw.toLowerCase() : "",
      cycle: cycleRaw ? cycleRaw.toLowerCase() : "",
      pack: packId ? packId.toLowerCase() : "",
    }
  }

  const productId = pickProductId(payload)
  if (!productId) {
    return { plan: "", cycle: "", pack: "" }
  }

  const planMappings: Array<{ productId?: string; plan: string; cycle: string }> = [
    { productId: process.env.CREEM_PRODUCT_ID_STARTER_MONTHLY, plan: "starter", cycle: "monthly" },
    { productId: process.env.CREEM_PRODUCT_ID_STARTER_YEARLY, plan: "starter", cycle: "yearly" },
    { productId: process.env.CREEM_PRODUCT_ID_PRO_MONTHLY, plan: "pro", cycle: "monthly" },
    { productId: process.env.CREEM_PRODUCT_ID_PRO_YEARLY, plan: "pro", cycle: "yearly" },
    { productId: process.env.CREEM_PRODUCT_ID_TEAM_MONTHLY, plan: "team", cycle: "monthly" },
    { productId: process.env.CREEM_PRODUCT_ID_TEAM_YEARLY, plan: "team", cycle: "yearly" },
  ]

  const packMappings: Array<{ productId?: string; pack: string }> = [
    { productId: process.env.CREEM_PRODUCT_ID_PACK_STARTER, pack: "starter-pack" },
    { productId: process.env.CREEM_PRODUCT_ID_PACK_GROWTH, pack: "growth-pack" },
    { productId: process.env.CREEM_PRODUCT_ID_PACK_PROFESSIONAL, pack: "professional-pack" },
    { productId: process.env.CREEM_PRODUCT_ID_PACK_ENTERPRISE, pack: "enterprise-pack" },
  ]

  const planMatch = planMappings.find((item) => item.productId === productId)
  if (planMatch) {
    return { plan: planMatch.plan, cycle: planMatch.cycle, pack: "" }
  }

  const packMatch = packMappings.find((item) => item.productId === productId)
  if (packMatch) {
    return { plan: "", cycle: "", pack: packMatch.pack }
  }

  return { plan: "", cycle: "", pack: "" }
}

const buildBillingRecord = (payload: CreemWebhookPayload) => {
  const eventType = pickEventType(payload)
  const status = pickStatus(payload)
  const isSuccess =
    SUCCESS_STATUSES.has(status) || SUCCESS_EVENT_HINTS.some((hint) => matchesEventHint(eventType, hint))
  const isFailure =
    FAILURE_STATUSES.has(status) || FAILURE_EVENT_HINTS.some((hint) => matchesEventHint(eventType, hint))
  if (!isSuccess && !isFailure) {
    return null
  }
  const normalizedStatus = isSuccess
    ? SUCCESS_STATUSES.has(status)
      ? status
      : "paid"
    : FAILURE_STATUSES.has(status)
      ? status
      : "payment_failed"
  const obj = pickObject(payload)
  const order = obj?.order
  const transaction = obj?.transaction
  const product = obj?.product
  const amount =
    toNumberOrNull(order?.amount) ??
    toNumberOrNull(transaction?.amount_paid) ??
    toNumberOrNull(transaction?.amount) ??
    toNumberOrNull(product?.price)
  const currency =
    toStringValue(order?.currency) ||
    toStringValue(transaction?.currency) ||
    toStringValue(product?.currency)
  const resolved = resolvePurchaseDetails(payload)
  const planLabel = resolved.plan
  const cycleLabel = resolved.cycle
  const packKey = resolved.pack
  const description = planLabel
    ? `Subscription ${planLabel}${cycleLabel ? ` (${cycleLabel})` : ""}`
    : packKey
      ? `Credit pack ${packKey}`
      : eventType || status || null
  const planCredits = planLabel ? PLAN_CREDITS[planLabel] : null
  const planCycle = cycleLabel === "yearly" ? "yearly" : "monthly"
  const cycleCredits = planCredits ? planCredits[planCycle] : null
  const credits = isSuccess
    ? packKey && PACK_CREDITS[packKey]
      ? PACK_CREDITS[packKey]
      : cycleCredits
        ? cycleCredits
        : null
    : null
  const expiresAt =
    isSuccess && planLabel
      ? (() => {
          const next = new Date()
          if (planCycle === "yearly") {
            next.setFullYear(next.getFullYear() + 1)
          } else {
            next.setMonth(next.getMonth() + 1)
          }
          return next.toISOString()
        })()
      : null

  const orderTransactionId = toStringValue(order?.transaction)
  return {
    event_type: eventType || null,
    status: normalizedStatus || (eventType ? eventType : null),
    description,
    customer_id: toStringValue(obj?.customer?.id),
    order_id: toStringValue(order?.id) || toStringValue(obj?.order),
    subscription_id: toStringValue(obj?.subscription?.id) || toStringValue(obj?.subscription),
    transaction_id:
      toStringValue(transaction?.id) || orderTransactionId || toStringValue(obj?.last_transaction_id),
    amount,
    currency: currency || null,
    credits,
    expires_at: expiresAt,
    raw_event: payload,
  }
}

const buildOrderKey = (record: ReturnType<typeof buildBillingRecord> | null) => {
  const orderId = toStringValue(record?.order_id)
  return orderId ? `order:${orderId}` : ""
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
  enterprise: { monthly: 3600, yearly: 43200 },
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
  const userIdFromMetadata =
    toStringValue(metadata.user_id) ||
    toStringValue(metadata.userId) ||
    toStringValue(payload.data?.customer?.metadata?.user_id) ||
    toStringValue(payload.data?.customer?.metadata?.userId) ||
    toStringValue(payload.data?.object?.customer?.metadata?.user_id) ||
    toStringValue(payload.data?.object?.customer?.metadata?.userId) ||
    toStringValue(payload.object?.customer?.metadata?.user_id) ||
    toStringValue(payload.object?.customer?.metadata?.userId)

  const admin = createAdminClient()
  let userId = userIdFromMetadata
  if (!userId) {
    const email = pickCustomerEmail(payload)
    if (email) {
      const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (usersError) {
        console.error("Failed to list users for webhook lookup", usersError)
      } else {
        const match = users.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
        userId = match?.id ?? ""
      }
    }
  }

  if (!userId) {
    console.warn("Missing user_id for Creem webhook", {
      eventType: pickEventType(payload),
      customerEmail: pickCustomerEmail(payload),
      metadataKeys: Object.keys(metadata || {}),
      eventId: pickEventId(payload, rawBody),
    })
    return NextResponse.json({ error: "Missing user_id metadata." }, { status: 400 })
  }

  const resolved = resolvePurchaseDetails(payload)
  const planNormalized = resolved.plan
  const status = pickStatus(payload)
  const eventType = pickEventType(payload)
  const eventId = pickEventId(payload, rawBody)
  const billingRecord = buildBillingRecord(payload)
  const idempotencyKey = buildOrderKey(billingRecord)
  const allowOrderProcessing = Boolean(idempotencyKey)
  const cycle = resolved.cycle
  const packId = resolved.pack
  console.info("Creem webhook received", {
    eventType,
    status,
    eventId,
    idempotencyKey,
    userId,
    plan: planNormalized || null,
    cycle: cycle || null,
    packId: packId || null,
  })
  if (!allowOrderProcessing) {
    console.warn("Skipping billing/grant processing without order_id", { eventId, userId, eventType })
  }

  const canceledStatuses = ["canceled", "cancelled"]
  const isCanceledEvent = eventType.includes("cancel")
  const isActive = !canceledStatuses.includes(status) && !isCanceledEvent
  const isProMember = planIsPro(planNormalized) && isActive
  const isSuccessStatus = ["paid", "succeeded", "completed"].includes(status)
  const isSuccessEvent =
    eventType.includes("paid") || eventType.includes("payment") || eventType.includes("checkout")
  const shouldGrant = isActive && (isSuccessStatus || isSuccessEvent)

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId)
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const existingMetadata = userData.user.user_metadata || {}
  const effectivePlan = planNormalized || toStringValue(existingMetadata.plan)
  const effectiveCycle = cycle || toStringValue(existingMetadata.cycle)
  const effectiveStatus = status || toStringValue(existingMetadata.subscription_status)
  const nextIsProMember = planIsPro(effectivePlan) && isActive
  const nextMetadata = {
    ...existingMetadata,
    plan: effectivePlan || existingMetadata.plan,
    cycle: effectiveCycle || existingMetadata.cycle,
    subscription_status: effectiveStatus || existingMetadata.subscription_status,
    isProMember: nextIsProMember,
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: nextMetadata,
  })

  if (updateError) {
    console.error("Failed to update user metadata from Creem webhook", updateError)
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 })
  }

  if (shouldGrant && allowOrderProcessing) {
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
          source_event_id: `${idempotencyKey}:pack`,
        },
        { onConflict: "source_event_id" }
      )
      if (packError) {
        console.error("Failed to grant pack credits", packError)
      } else {
        console.info("Granted pack credits", { userId, packId, eventId })
      }
    }

    if (planNormalized && PLAN_CREDITS[planNormalized]) {
      const planCredits = PLAN_CREDITS[planNormalized]
      const grantCycle = cycle === "yearly" ? "yearly" : "monthly"
      const credits = planCredits[grantCycle]
      const expiresAt = new Date(now)
      if (grantCycle === "yearly") {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      }
      const { error: planError } = await admin.from("credit_grants").upsert(
        {
          user_id: userId,
          source: "subscription",
          plan_id: planNormalized,
          cycle: grantCycle,
          credits_total: credits,
          credits_remaining: credits,
          expires_at: expiresAt.toISOString(),
          source_event_id: `${idempotencyKey}:subscription`,
        },
        { onConflict: "source_event_id" }
      )
      if (planError) {
        console.error("Failed to grant subscription credits", planError)
      } else {
        console.info("Granted subscription credits", {
          userId,
          plan: planNormalized,
          cycle,
          eventId,
        })
      }
    }
  }

  if (billingRecord && allowOrderProcessing) {
    const { error: billingError } = await admin.from("billing_records").upsert(
      {
        user_id: userId,
        source_event_id: idempotencyKey,
        ...billingRecord,
      },
      { onConflict: "source_event_id" }
    )
    if (billingError) {
      console.error("Failed to record billing event", billingError)
    } else {
      console.info("Recorded billing event", { userId, eventId, eventType })
    }
  }

  return NextResponse.json({ ok: true })
}
