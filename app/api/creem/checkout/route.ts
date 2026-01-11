import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PLAN_ENV_KEYS: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: "CREEM_PRODUCT_ID_STARTER_MONTHLY",
    yearly: "CREEM_PRODUCT_ID_STARTER_YEARLY",
  },
  pro: {
    monthly: "CREEM_PRODUCT_ID_PRO_MONTHLY",
    yearly: "CREEM_PRODUCT_ID_PRO_YEARLY",
  },
  team: {
    monthly: "CREEM_PRODUCT_ID_TEAM_MONTHLY",
    yearly: "CREEM_PRODUCT_ID_TEAM_YEARLY",
  },
}

type CheckoutRequest = {
  plan?: string
  email?: string
  cycle?: "monthly" | "yearly"
}

export async function POST(req: Request) {
  let body: CheckoutRequest | null = null
  try {
    body = (await req.json()) as CheckoutRequest
  } catch (err) {
    console.warn("Failed to parse checkout request body", err)
  }

  const plan = typeof body?.plan === "string" ? body.plan : ""
  const email = typeof body?.email === "string" ? body.email.trim() : ""
  const cycle = body?.cycle === "yearly" ? "yearly" : "monthly"

  if (!plan) {
    return NextResponse.json({ error: "Plan is required." }, { status: 400 })
  }

  const envKey = PLAN_ENV_KEYS[plan]?.[cycle]
  const productId = envKey ? process.env[envKey] : undefined
  if (!productId) {
    return NextResponse.json(
      { error: `Missing product id for plan "${plan}". Add ${envKey ?? "the product id"} to your environment.` },
      { status: 500 }
    )
  }

  const apiKey = process.env.CREEM_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Missing CREEM_API_KEY on the server." }, { status: 500 })
  }

  const baseUrl = process.env.CREEM_BASE_URL || "https://api.creem.io"
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
  const successUrl = process.env.CREEM_SUCCESS_URL || `${origin}/pricing?status=success&plan=${plan}`

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user

  const payload: Record<string, unknown> = {
    product_id: productId,
    units: 1,
    request_id: crypto.randomUUID(),
    success_url: successUrl,
    metadata: { plan, cycle, user_id: user?.id },
  }

  const customerEmail = email || user?.email
  if (customerEmail) {
    payload.customer = { email: customerEmail }
  }

  const creemRes = await fetch(`${baseUrl}/v1/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  })

  const data = await creemRes.json().catch(() => null)
  if (!creemRes.ok) {
    const message = data?.message || data?.error || "Unable to create checkout session."
    return NextResponse.json({ error: message, details: data }, { status: creemRes.status })
  }

  const checkoutUrl = data?.checkout_url || data?.checkout?.checkout_url
  if (!checkoutUrl) {
    return NextResponse.json(
      { error: "Creem did not return a checkout URL.", details: data },
      { status: 502 }
    )
  }

  return NextResponse.json({ checkoutUrl })
}
