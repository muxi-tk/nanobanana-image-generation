import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Supabase OAuth callback failed", error)
      const errorRedirect = new URL("/", requestUrl.origin)
      errorRedirect.searchParams.set("auth_error", "google")
      return NextResponse.redirect(errorRedirect)
    }

    const user = data?.user
    if (user) {
      const admin = createAdminClient()
      const signupSourceId = `signup:${user.id}`
      const { data: existingRecord, error: lookupError } = await admin
        .from("billing_records")
        .select("id")
        .eq("source_event_id", signupSourceId)
        .maybeSingle()

      if (lookupError) {
        console.error("Failed to check signup bonus record", lookupError)
      }

      if (!existingRecord) {
        const { error: billingError } = await admin.from("billing_records").upsert(
          {
            user_id: user.id,
            source_event_id: signupSourceId,
            event_type: "signup_bonus",
            status: "paid",
            description: "signup bonus",
            amount: 0,
            currency: null,
            credits: 10,
          },
          { onConflict: "source_event_id" }
        )
        if (billingError) {
          console.error("Failed to record signup bonus", billingError)
        }
      }
    }
  }

  const redirectPath = next.startsWith("/") ? next : "/"
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}
