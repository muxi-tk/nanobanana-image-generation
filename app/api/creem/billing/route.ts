import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type CreemCustomer = {
  id?: string
}

export async function GET(req: Request) {
  const apiKey = process.env.CREEM_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Missing CREEM_API_KEY on the server." }, { status: 500 })
  }

  const allowedStatuses = ["paid", "succeeded", "completed", "payment_failed", "failed", "unpaid"]
  const baseUrl = process.env.CREEM_BASE_URL || "https://api.creem.io"
  const { searchParams } = new URL(req.url)
  const query = (searchParams.get("q") || "").trim()
  const dateRange = (searchParams.get("date") || "all").trim().toLowerCase()
  const startParam = searchParams.get("start")
  const endParam = searchParams.get("end")
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1)
  const pageSizeRaw = Number.parseInt(searchParams.get("page_size") || "20", 10)
  const pageSize = [10, 20, 30, 40, 50].includes(pageSizeRaw) ? pageSizeRaw : 20
  const rangeFrom = (page - 1) * pageSize
  const rangeTo = rangeFrom + pageSize - 1
  const toIsoString = (value: string | null) => {
    if (!value) return null
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed.toISOString()
  }
  const startIso = toIsoString(startParam)
  const endIso = toIsoString(endParam)
  const hasExplicitRange = Boolean(startIso || endIso)
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const email = authData.user.email
  if (!email) {
    return NextResponse.json({ error: "Missing user email." }, { status: 400 })
  }

  const customerRes = await fetch(`${baseUrl}/v1/customers?email=${encodeURIComponent(email)}`, {
    headers: {
      "x-api-key": apiKey,
    },
  })

  const customerData = (await customerRes.json().catch(() => null)) as CreemCustomer | null
  const customerId = customerData?.id ?? null
  const admin = createAdminClient()
  let recordsQuery = admin
    .from("billing_records")
    .select(
      "id, amount, currency, status, event_type, description, credits, created_at, expires_at, order_id, transaction_id, subscription_id",
      {
        count: "exact",
      }
    )
    .eq("user_id", authData.user.id)
    .in("status", allowedStatuses)
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo)

  if (query) {
    const like = `%${query}%`
    recordsQuery = recordsQuery.or(
      [
        `description.ilike.${like}`,
        `event_type.ilike.${like}`,
        `status.ilike.${like}`,
        `order_id.ilike.${like}`,
        `transaction_id.ilike.${like}`,
        `subscription_id.ilike.${like}`,
      ].join(",")
    )
  }
  if (startIso) {
    recordsQuery = recordsQuery.gte("created_at", startIso)
  }
  if (endIso) {
    recordsQuery = recordsQuery.lte("created_at", endIso)
  }
  if (!hasExplicitRange && (dateRange === "7" || dateRange === "30")) {
    const days = dateRange === "7" ? 7 : 30
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    recordsQuery = recordsQuery.gte("created_at", cutoff)
  }

  const { data: records, error: recordsError, count } = await recordsQuery

  if (recordsError) {
    console.error("Failed to load billing records", recordsError)
  }

  if (!customerId) {
    return NextResponse.json({
      portalUrl: null,
      transactions:
        records?.map((record) => ({
          id: record.id,
          amount: record.amount ?? null,
          currency: record.currency ?? null,
          status: record.status ?? "unknown",
          created_at: new Date(record.created_at).getTime(),
          expires_at: record.expires_at ? new Date(record.expires_at).getTime() : null,
          type: record.event_type ?? null,
          description: record.description ?? null,
          credits: typeof record.credits === "number" ? record.credits : null,
          order_id: record.order_id ?? null,
          transaction_id: record.transaction_id ?? null,
          subscription_id: record.subscription_id ?? null,
        })) ?? [],
      total: count ?? 0,
      page,
      pageSize,
    })
  }

  const portalRes = await fetch(`${baseUrl}/v1/customers/billing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ customer_id: customerId }),
  })

  const portalData = (await portalRes.json().catch(() => null)) as { customer_portal_link?: string } | null
  const portalUrl = portalRes.ok ? portalData?.customer_portal_link ?? null : null

  return NextResponse.json({
    portalUrl,
    transactions:
      records?.map((record) => ({
        id: record.id,
        amount: record.amount ?? null,
        currency: record.currency ?? null,
        status: record.status ?? "unknown",
        created_at: new Date(record.created_at).getTime(),
        expires_at: record.expires_at ? new Date(record.expires_at).getTime() : null,
        type: record.event_type ?? null,
        description: record.description ?? null,
        credits: typeof record.credits === "number" ? record.credits : null,
        order_id: record.order_id ?? null,
        transaction_id: record.transaction_id ?? null,
        subscription_id: record.subscription_id ?? null,
      })) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  })
}
