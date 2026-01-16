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
  let creditsValue: number | null = null

  if (!isProMember) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (!profileError && profile) {
      const profilePlan = `${profile.plan ?? profile.tier ?? ""}`.toLowerCase()
      const profileActive = `${profile.subscription_status ?? ""}`.toLowerCase() === "active"
      isProMember =
        Boolean(profile.is_pro) || profileActive || ["pro", "team", "enterprise", "studio", "vip"].includes(profilePlan)
      const profileCredits = Number(
        profile.credits ??
          profile.credit_balance ??
          profile.balance ??
          profile.credit ??
          profile.remaining_credits ??
          profile.available_credits
      )
      if (!Number.isNaN(profileCredits)) {
        creditsValue = profileCredits
      }
    }
  }

  if (creditsValue === null) {
    const nowIso = new Date().toISOString()
    const { data: grants, error: grantsError } = await supabase
      .from("credit_grants")
      .select("source, credits_remaining, expires_at")
      .eq("user_id", user.id)
      .gt("credits_remaining", 0)

    if (!grantsError && Array.isArray(grants)) {
      let subscriptionCredits = 0
      let packCredits = 0
      grants.forEach((grant) => {
        if (grant.source === "subscription") {
          if (!grant.expires_at || grant.expires_at > nowIso) {
            subscriptionCredits += grant.credits_remaining
          }
        } else if (grant.source === "credit-pack") {
          packCredits += grant.credits_remaining
        }
      })
      const totalCredits = subscriptionCredits + packCredits
      if (totalCredits > 0) {
        creditsValue = totalCredits
        if (subscriptionCredits > 0) {
          isProMember = true
        }
      }
    }
  }

  if (creditsValue === null) {
    const metaCredits = Number(
      meta.credits ?? meta.credit_balance ?? meta.balance ?? meta.credit ?? meta.remaining_credits ?? meta.available_credits
    )
    if (!Number.isNaN(metaCredits)) {
      creditsValue = metaCredits
    }
  }

  if (creditsValue === null) {
    creditsValue = 10
  }

  return NextResponse.json({ ok: true, userId: user.id, isProMember, credits: creditsValue })
}
