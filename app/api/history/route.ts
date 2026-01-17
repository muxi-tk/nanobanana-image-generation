import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = (searchParams.get("q") || "").trim()
  const type = (searchParams.get("type") || "all").trim().toLowerCase()
  const dateRange = (searchParams.get("date") || "all").trim().toLowerCase()
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1)
  const pageSizeRaw = Number.parseInt(searchParams.get("page_size") || "20", 10)
  const pageSize = [10, 20, 30, 40, 50].includes(pageSizeRaw) ? pageSizeRaw : 20
  const rangeFrom = (page - 1) * pageSize
  const rangeTo = rangeFrom + pageSize - 1

  let historyQuery = supabase
    .from("image_history")
    .select(
      "id, created_at, prompt, image_urls, model, aspect_ratio, resolution, output_format, generation_mode, credits_per_image, credits_total, image_count",
      { count: "exact" }
    )
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo)

  if (query) {
    historyQuery = historyQuery.ilike("prompt", `%${query}%`)
  }

  if (type !== "all") {
    historyQuery = historyQuery.eq("generation_mode", type)
  }

  if (dateRange === "7" || dateRange === "30") {
    const days = dateRange === "7" ? 7 : 30
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    historyQuery = historyQuery.gte("created_at", cutoff)
  }

  const { data, error, count } = await historyQuery

  if (error) {
    console.error("Failed to fetch image history", error)
    return NextResponse.json({ error: "Failed to fetch history." }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [], total: count ?? 0, page, pageSize })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing history id." }, { status: 400 })
  }

  const { error } = await supabase
    .from("image_history")
    .delete()
    .eq("id", id)
    .eq("user_id", authData.user.id)

  if (error) {
    console.error("Failed to delete history item", error)
    return NextResponse.json({ error: "Failed to delete history item." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
