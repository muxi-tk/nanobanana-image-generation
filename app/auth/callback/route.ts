import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Supabase OAuth callback failed", error)
      const errorRedirect = new URL("/", requestUrl.origin)
      errorRedirect.searchParams.set("auth_error", "google")
      return NextResponse.redirect(errorRedirect)
    }
  }

  const redirectPath = next.startsWith("/") ? next : "/"
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}
