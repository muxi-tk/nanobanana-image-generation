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
  let planNormalized = planValue.toString().toLowerCase()
  const cycleValue = (meta.cycle ?? meta.billing_cycle ?? "") as string
  let cycleNormalized = cycleValue.toString().toLowerCase()
  const statusValue = (meta.subscription_status ?? meta.status ?? "") as string
  let statusNormalized = statusValue.toString().toLowerCase()
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
  let profileCredits: number | null = null
  let hasCreditPack = false
  let subscriptions: Array<{
    id: string
    plan: string | null
    cycle: string | null
    creditsRemaining: number
    expiresAt: string | null
    createdAt: string | null
    active: boolean
  }> = []

  const planRank = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "enterprise":
      case "team":
        return 3
      case "pro":
      case "studio":
      case "vip":
        return 2
      case "starter":
        return 1
      default:
        return 0
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (!profileError && profile) {
    const resolvedProfileCredits = Number(
      profile.credits ??
        profile.credit_balance ??
        profile.balance ??
        profile.credit ??
        profile.remaining_credits ??
        profile.available_credits
    )
    if (!Number.isNaN(resolvedProfileCredits)) {
      profileCredits = resolvedProfileCredits
      if (creditsValue === null) {
        creditsValue = resolvedProfileCredits
      }
    }
    if (!isProMember) {
      const profilePlan = `${profile.plan ?? profile.tier ?? ""}`.toLowerCase()
      const profileActive = `${profile.subscription_status ?? ""}`.toLowerCase() === "active"
      isProMember =
        Boolean(profile.is_pro) ||
        profileActive ||
        ["pro", "team", "enterprise", "studio", "vip"].includes(profilePlan)
    }
  }

  const nowIso = new Date().toISOString()
  const { data: grants, error: grantsError } = await supabase
    .from("credit_grants")
    .select("id, source, credits_remaining, expires_at, plan_id, cycle, created_at")
    .eq("user_id", user.id)

  if (!grantsError && Array.isArray(grants)) {
    const activeSubscriptionGrants = grants.filter(
      (grant) => grant.source === "subscription" && (!grant.expires_at || grant.expires_at > nowIso)
    )
    const topSubscription = activeSubscriptionGrants.reduce(
      (best, grant) => {
        if (!best) return grant
        const bestPlan = typeof best.plan_id === "string" ? best.plan_id : ""
        const grantPlan = typeof grant.plan_id === "string" ? grant.plan_id : ""
        const bestRank = planRank(bestPlan)
        const grantRank = planRank(grantPlan)
        if (grantRank !== bestRank) {
          return grantRank > bestRank ? grant : best
        }
        const bestExpiry = best.expires_at ? new Date(best.expires_at).getTime() : Number.MAX_SAFE_INTEGER
        const grantExpiry = grant.expires_at ? new Date(grant.expires_at).getTime() : Number.MAX_SAFE_INTEGER
        if (grantExpiry !== bestExpiry) {
          return grantExpiry > bestExpiry ? grant : best
        }
        const bestCreated = new Date(best.created_at).getTime()
        const grantCreated = new Date(grant.created_at).getTime()
        return grantCreated > bestCreated ? grant : best
      },
      null as (typeof grants)[number] | null
    )

    if (topSubscription && typeof topSubscription.plan_id === "string" && topSubscription.plan_id.trim()) {
      planNormalized = topSubscription.plan_id.toLowerCase()
      if (typeof topSubscription.cycle === "string" && topSubscription.cycle.trim()) {
        cycleNormalized = topSubscription.cycle.toLowerCase()
      }
      isProMember = planRank(planNormalized) >= 2
    }

    let subscriptionCredits = 0
    let packCredits = 0
    grants.forEach((grant) => {
      const remaining =
        typeof grant.credits_remaining === "number" && Number.isFinite(grant.credits_remaining)
          ? grant.credits_remaining
          : 0
      if (grant.source === "subscription") {
        if (!grant.expires_at || grant.expires_at > nowIso) {
          subscriptionCredits += Math.max(0, remaining)
        }
      } else if (grant.source === "credit-pack") {
        packCredits += Math.max(0, remaining)
      }
    })
    hasCreditPack = packCredits > 0
    const totalCredits = subscriptionCredits + packCredits
    const legacyCredits = typeof profileCredits === "number" && Number.isFinite(profileCredits) ? profileCredits : 0
    if (grants.length > 0) {
      creditsValue = totalCredits + legacyCredits
    } else if (creditsValue === null && totalCredits > 0) {
      creditsValue = totalCredits
    }
    if (subscriptionCredits > 0 && planRank(planNormalized) === 0) {
      isProMember = true
    }

    subscriptions = grants
      .filter((grant) => grant.source === "subscription")
      .map((grant) => ({
        id: grant.id,
        plan: typeof grant.plan_id === "string" && grant.plan_id.trim() ? grant.plan_id.toLowerCase() : null,
        cycle: typeof grant.cycle === "string" && grant.cycle.trim() ? grant.cycle.toLowerCase() : null,
        creditsRemaining:
          typeof grant.credits_remaining === "number" && Number.isFinite(grant.credits_remaining)
            ? grant.credits_remaining
            : 0,
        expiresAt: grant.expires_at ?? null,
        createdAt: grant.created_at ?? null,
        active: !grant.expires_at || grant.expires_at > nowIso,
      }))
      .sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1
        const aRank = planRank(a.plan ?? "")
        const bRank = planRank(b.plan ?? "")
        if (aRank !== bRank) return bRank - aRank
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })
    if (subscriptions.length) {
      const hasActiveSubscription = subscriptions.some((subscription) => subscription.active)
      statusNormalized = hasActiveSubscription ? "active" : "expired"
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

  return NextResponse.json({
    ok: true,
    userId: user.id,
    isProMember,
    credits: creditsValue,
    plan: planNormalized || null,
    cycle: cycleNormalized || null,
    subscriptionStatus: statusNormalized || null,
    hasCreditPack,
    subscriptions,
  })
}
