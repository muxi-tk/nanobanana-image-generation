import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("image_history")
    .select(
      "id, created_at, prompt, image_urls, model, aspect_ratio, resolution, output_format, generation_mode"
    )
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch image history", error)
    return NextResponse.json({ error: "Failed to fetch history." }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
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
