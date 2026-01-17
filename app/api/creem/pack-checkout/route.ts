import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PACK_ENV_KEYS: Record<string, string> = {
  "starter-pack": "CREEM_PRODUCT_ID_PACK_STARTER",
  "growth-pack": "CREEM_PRODUCT_ID_PACK_GROWTH",
  "professional-pack": "CREEM_PRODUCT_ID_PACK_PROFESSIONAL",
  "enterprise-pack": "CREEM_PRODUCT_ID_PACK_ENTERPRISE",
}

type PackCheckoutRequest = {
  pack?: string
  email?: string
}

export async function POST(req: Request) {
  let body: PackCheckoutRequest | null = null
  try {
    body = (await req.json()) as PackCheckoutRequest
  } catch (err) {
    console.warn("Failed to parse pack checkout request body", err)
  }

  const pack = typeof body?.pack === "string" ? body.pack : ""
  const email = typeof body?.email === "string" ? body.email.trim() : ""

  if (!pack) {
    return NextResponse.json({ error: "Pack is required." }, { status: 400 })
  }

  const envKey = PACK_ENV_KEYS[pack]
  const productId = envKey ? process.env[envKey] : undefined
  if (!productId) {
    return NextResponse.json(
      { error: `Missing product id for pack "${pack}". Add ${envKey ?? "the product id"} to your environment.` },
      { status: 500 }
    )
  }

  const apiKey = process.env.CREEM_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Missing CREEM_API_KEY on the server." }, { status: 500 })
  }

  const baseUrl = process.env.CREEM_BASE_URL || "https://api.creem.io"
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
  const successUrl = process.env.CREEM_SUCCESS_URL || `${origin}/generator`

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload: Record<string, unknown> = {
    product_id: productId,
    units: 1,
    request_id: crypto.randomUUID(),
    success_url: successUrl,
    metadata: { pack, user_id: user?.id },
  }

  const customerEmail = user.email || email
  if (customerEmail) {
    payload.customer = {
      email: customerEmail,
      metadata: user?.id ? { user_id: user.id } : undefined,
    }
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
      { error: "Checkout did not return a URL.", details: data },
      { status: 502 }
    )
  }

  return NextResponse.json({ checkoutUrl })
}
