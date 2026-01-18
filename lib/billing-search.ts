import { translations } from "@/lib/i18n"

type BillingSearchInput = {
  description?: string | null
  eventType?: string | null
  status?: string | null
  orderId?: string | null
  transactionId?: string | null
  subscriptionId?: string | null
}

type BillingLocale = "en" | "zh"

const localeMap = {
  en: translations.en,
  zh: translations.zh,
} as const

const SUCCESS_STATUSES = new Set(["paid", "succeeded", "completed"])
const FAILURE_STATUSES = new Set(["payment_failed", "failed", "unpaid"])

const formatPlanLabel = (value: string, locale: BillingLocale) => {
  const normalized = value.trim().toLowerCase()
  const t = localeMap[locale]
  if (normalized === "starter") return t.planStarter
  if (normalized === "pro") return t.planPro
  if (normalized === "team") return t.planTeam
  if (normalized === "enterprise") return t.planEnterprise
  return value
}

const formatCycleLabel = (value: string, locale: BillingLocale) => {
  const normalized = value.trim().toLowerCase()
  const t = localeMap[locale]
  if (normalized === "monthly") return t.planCycleMonthly
  if (normalized === "yearly") return t.planCycleYearly
  return value
}

const formatPackLabel = (value: string, locale: BillingLocale) => {
  const normalized = value.trim().toLowerCase()
  const t = localeMap[locale]
  if (normalized === "starter-pack") return t.billingPackStarter
  if (normalized === "growth-pack") return t.billingPackGrowth
  if (normalized === "professional-pack") return t.billingPackProfessional
  if (normalized === "enterprise-pack") return t.billingPackEnterprise
  return value
}

const formatDescription = (value: string, locale: BillingLocale) => {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const t = localeMap[locale]
  if (/^(signup|registration)[\s_-]?bonus$/i.test(trimmed)) {
    return t.billingDescSignupBonus
  }
  const subscriptionMatch = trimmed.match(/^subscription\s+(.+?)(?:\s+\((.+)\))?$/i)
  if (subscriptionMatch) {
    const planLabel = formatPlanLabel(subscriptionMatch[1], locale)
    const cycleLabel = subscriptionMatch[2] ? formatCycleLabel(subscriptionMatch[2], locale) : ""
    return cycleLabel
      ? `${t.billingDescSubscriptionCharge} ${planLabel} (${cycleLabel})`
      : `${t.billingDescSubscriptionCharge} ${planLabel}`
  }
  const packMatch = trimmed.match(/^credit\s+pack\s+(.+)$/i)
  if (packMatch) {
    const packLabel = formatPackLabel(packMatch[1], locale)
    return `${t.billingDescCreditPackPurchase} ${packLabel}`
  }
  if (/^[a-z0-9]+([._-][a-z0-9]+)+$/i.test(trimmed)) {
    return t.billingHistoryItem
  }
  return trimmed
}

const formatStatusLabel = (value: string | null | undefined, locale: BillingLocale) => {
  if (!value) return ""
  const normalized = value.trim().toLowerCase()
  if (SUCCESS_STATUSES.has(normalized)) return localeMap[locale].billingStatusSuccess
  if (FAILURE_STATUSES.has(normalized)) return localeMap[locale].billingStatusFailure
  return ""
}

export const buildBillingSearchText = (input: BillingSearchInput) => {
  const parts = new Set<string>()
  const add = (value?: string | null) => {
    if (!value) return
    const trimmed = value.trim()
    if (trimmed) {
      parts.add(trimmed)
    }
  }

  add(input.description)
  add(input.eventType)
  add(input.status)
  add(input.orderId)
  add(input.transactionId)
  add(input.subscriptionId)

  if (input.description) {
    add(formatDescription(input.description, "en"))
    add(formatDescription(input.description, "zh"))
  }

  add(formatStatusLabel(input.status, "en"))
  add(formatStatusLabel(input.status, "zh"))

  return Array.from(parts).join(" ")
}
