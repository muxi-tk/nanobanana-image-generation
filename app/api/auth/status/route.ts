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

  const user = data.user
  const meta = { ...user.app_metadata, ...user.user_metadata }

  const planValue = (meta.plan ?? meta.tier ?? meta.subscription ?? "") as string
  const planNormalized = planValue.toString().toLowerCase()
  const hasProPlan = ["pro", "team", "enterprise", "studio", "vip"].includes(planNormalized)

  const hasProFlag = Boolean(
    meta.is_pro ??
      meta.isPro ??
      meta.isProMember ??
      meta.pro ??
      meta.vip ??
      meta.is_vip ??
      meta.isVIP
  )

  let isProMember = hasProPlan || hasProFlag

  if (!isProMember) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_pro, plan, tier, subscription_status")
      .eq("id", user.id)
      .maybeSingle()

    if (!profileError && profile) {
      const profilePlan = `${profile.plan ?? profile.tier ?? ""}`.toLowerCase()
      const profileActive = `${profile.subscription_status ?? ""}`.toLowerCase() === "active"
      isProMember =
        Boolean(profile.is_pro) || profileActive || ["pro", "team", "enterprise", "studio", "vip"].includes(profilePlan)
    }
  }

  return NextResponse.json({ ok: true, userId: user.id, isProMember })
}
