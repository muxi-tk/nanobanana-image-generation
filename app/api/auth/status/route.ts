import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    console.error("Auth status check failed", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!data?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({ ok: true, userId: data.user.id })
}

