import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type ShareRequest = {
  historyId?: string
  imageUrl?: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as ShareRequest | null
  const historyId = typeof payload?.historyId === "string" ? payload.historyId.trim() : ""
  const imageUrl = typeof payload?.imageUrl === "string" ? payload.imageUrl.trim() : ""

  if (!historyId || !imageUrl) {
    return NextResponse.json({ error: "Missing share payload." }, { status: 400 })
  }

  const { data: history, error: historyError } = await supabase
    .from("image_history")
    .select("id, image_urls")
    .eq("id", historyId)
    .maybeSingle()

  if (historyError) {
    return NextResponse.json({ error: "Failed to load history." }, { status: 500 })
  }

  if (!history) {
    return NextResponse.json({ error: "History not found." }, { status: 404 })
  }

  const images = Array.isArray(history.image_urls) ? history.image_urls : []
  if (!images.includes(imageUrl)) {
    return NextResponse.json({ error: "Image does not match history." }, { status: 400 })
  }

  const { data: existingShare } = await supabase
    .from("share_links")
    .select("id")
    .eq("history_id", historyId)
    .eq("image_url", imageUrl)
    .maybeSingle()

  if (existingShare?.id) {
    return NextResponse.json({ shareId: existingShare.id })
  }

  const { data: share, error: shareError } = await supabase
    .from("share_links")
    .insert({
      user_id: user.id,
      history_id: historyId,
      image_url: imageUrl,
    })
    .select("id")
    .single()

  if (shareError || !share?.id) {
    return NextResponse.json({ error: "Failed to create share link." }, { status: 500 })
  }

  return NextResponse.json({ shareId: share.id })
}
