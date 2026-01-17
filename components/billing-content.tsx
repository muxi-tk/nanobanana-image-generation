"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import type { DateRange } from "react-day-picker"

type BillingTransaction = {
  id: string
  amount: number | null
  currency: string | null
  status: string
  created_at: number
  expires_at?: number | null
  type?: string | null
  description?: string | null
  credits?: number | null
  order_id?: string | null
  transaction_id?: string | null
  subscription_id?: string | null
}

type BillingResponse = {
  portalUrl?: string | null
  transactions?: BillingTransaction[]
  total?: number
  page?: number
  pageSize?: number
}

export function BillingContent() {
  const { locale, t } = useI18n()
  const [billingInfo, setBillingInfo] = useState<BillingResponse | null>(null)
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setPage(1)
  }, [search, dateRange?.from, dateRange?.to])

  const formatRangeDate = (date: Date) => {
    const targetLocale = locale === "zh" ? "zh-CN" : "en-US"
    return new Intl.DateTimeFormat(targetLocale, {
      year: "numeric",
      month: locale === "zh" ? "2-digit" : "short",
      day: "2-digit",
    }).format(date)
  }
  const rangeLabel = useMemo(() => {
    if (!dateRange?.from) {
      return t("billingDateRangePlaceholder")
    }
    if (dateRange.to) {
      return `${formatRangeDate(dateRange.from)} - ${formatRangeDate(dateRange.to)}`
    }
    return formatRangeDate(dateRange.from)
  }, [dateRange?.from, dateRange?.to, locale, t])
  const toStartOfDayIso = (value?: Date) => {
    if (!value) return ""
    const start = new Date(value)
    start.setHours(0, 0, 0, 0)
    return start.toISOString()
  }
  const toEndOfDayIso = (value?: Date) => {
    if (!value) return ""
    const end = new Date(value)
    end.setHours(23, 59, 59, 999)
    return end.toISOString()
  }
  const startIso = useMemo(() => toStartOfDayIso(dateRange?.from), [dateRange?.from])
  const endIso = useMemo(() => {
    const target = dateRange?.to ?? dateRange?.from
    return toEndOfDayIso(target)
  }, [dateRange?.from, dateRange?.to])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    const load = async () => {
      try {
        const params = new URLSearchParams()
        if (search.trim()) {
          params.set("q", search.trim())
        }
        if (startIso) {
          params.set("start", startIso)
        }
        if (endIso) {
          params.set("end", endIso)
        }
        params.set("page", page.toString())
        params.set("page_size", pageSize.toString())
        const billingRes = await fetch(`/api/creem/billing?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        if (billingRes.ok) {
          const billingData = (await billingRes.json().catch(() => null)) as BillingResponse | null
          if (isMounted) {
            setBillingInfo(billingData)
            setTotal(typeof billingData?.total === "number" ? billingData.total : 0)
          }
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return
        }
        console.error("Failed to load billing records", err)
      }
    }
    const timeoutId = setTimeout(load, 250)
    return () => {
      isMounted = false
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [endIso, page, pageSize, search, startIso])

  const transactions = billingInfo?.transactions ?? []
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageOptions = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => `${index + 1}`),
    [totalPages]
  )
  const formatAmount = (amount: number | null, currency: string | null) => {
    if (amount === null) {
      return t("billingAmountUnavailable")
    }
    if (amount === 0 && !currency) {
      return "0"
    }
    const currencyCode = (currency || "usd").toUpperCase()
    try {
      const formatted = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
        currencyDisplay: "narrowSymbol",
      }).format(amount / 100)
      return formatted.replace(/^US\s*\$/i, "$")
    } catch {
      if (currencyCode === "USD") {
        return `$${(amount / 100).toFixed(2)}`
      }
      return `${(amount / 100).toFixed(2)} ${currencyCode}`
    }
  }
  const formatDate = (value: number) => {
    const timestamp = value < 1_000_000_000_000 ? value * 1000 : value
    return new Date(timestamp).toLocaleString()
  }
  const formatDateShort = (value: number) => {
    const timestamp = value < 1_000_000_000_000 ? value * 1000 : value
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(timestamp))
  }
  const formatOptionalDate = (value: number | null | undefined) => {
    if (typeof value !== "number") {
      return "-"
    }
    return formatDate(value)
  }
  const formatOptionalDateShort = (value: number | null | undefined) => {
    if (typeof value !== "number") {
      return "-"
    }
    return formatDateShort(value)
  }
  const isFailureStatus = (value: string | null | undefined) => {
    const normalized = value?.trim().toLowerCase() ?? ""
    return ["payment_failed", "failed", "unpaid"].includes(normalized)
  }
  const isSuccessStatus = (value: string | null | undefined) => {
    const normalized = value?.trim().toLowerCase() ?? ""
    return ["paid", "succeeded", "completed"].includes(normalized)
  }
  const formatStatus = (value: string | null | undefined) => {
    if (!value) {
      return "-"
    }
    if (isSuccessStatus(value)) {
      return t("billingStatusSuccess")
    }
    if (isFailureStatus(value)) {
      return t("billingStatusFailure")
    }
    return "-"
  }
  const formatPlanLabel = (value: string) => {
    const normalized = value.trim().toLowerCase()
    if (normalized === "starter") return t("planStarter")
    if (normalized === "pro") return t("planPro")
    if (normalized === "team") return t("planTeam")
    if (normalized === "enterprise") return t("planEnterprise")
    return value
  }
  const formatCycleLabel = (value: string) => {
    const normalized = value.trim().toLowerCase()
    if (normalized === "monthly") return t("planCycleMonthly")
    if (normalized === "yearly") return t("planCycleYearly")
    return value
  }
  const formatPackLabel = (value: string) => {
    const normalized = value.trim().toLowerCase()
    if (normalized === "starter-pack") return t("billingPackStarter")
    if (normalized === "growth-pack") return t("billingPackGrowth")
    if (normalized === "professional-pack") return t("billingPackProfessional")
    if (normalized === "enterprise-pack") return t("billingPackEnterprise")
    return value
  }
  const formatDescription = (value?: string | null) => {
    if (!value) return ""
    const trimmed = value.trim()
    if (!trimmed) return ""
    if (/^(signup|registration)[\s_-]?bonus$/i.test(trimmed)) {
      return t("billingDescSignupBonus")
    }
    const subscriptionMatch = trimmed.match(/^subscription\s+(.+?)(?:\s+\((.+)\))?$/i)
    if (subscriptionMatch) {
      const planLabel = formatPlanLabel(subscriptionMatch[1])
      const cycleLabel = subscriptionMatch[2] ? formatCycleLabel(subscriptionMatch[2]) : ""
      return cycleLabel
        ? `${t("billingDescSubscriptionCharge")} ${planLabel} (${cycleLabel})`
        : `${t("billingDescSubscriptionCharge")} ${planLabel}`
    }
    const packMatch = trimmed.match(/^credit\s+pack\s+(.+)$/i)
    if (packMatch) {
      const packLabel = formatPackLabel(packMatch[1])
      return `${t("billingDescCreditPackPurchase")} ${packLabel}`
    }
    if (/^[a-z0-9]+([._-][a-z0-9]+)+$/i.test(trimmed)) {
      return t("billingHistoryItem")
    }
    return trimmed
  }
  const formatPaymentId = (orderId?: string | null, transactionId?: string | null) => {
    const raw = orderId || transactionId || ""
    if (!raw) {
      return "—"
    }
    return raw
  }
  const formatCredits = (credits: number | null | undefined, status: string | null | undefined) => {
    if (isFailureStatus(status)) {
      return "-"
    }
    if (typeof credits === "number") {
      return `${credits}`
    }
    if (isSuccessStatus(status)) {
      return "-"
    }
    return "-"
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-background p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("billingSearchPlaceholder")}
              className="h-11"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("billingDateRange")}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-11 w-full justify-start rounded-full border-border/60 bg-muted/40 text-left font-normal shadow-sm transition-colors hover:bg-muted/60 sm:w-[280px]",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span className="truncate">{rangeLabel}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-2xl border-border/60 bg-background/95 p-2 shadow-xl" align="end">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={dateRange}
                    onSelect={setDateRange}
                    className="bg-transparent p-2 [--cell-size:--spacing(9)]"
                    classNames={{
                      months: "flex flex-col gap-6 md:flex-row",
                      month: "flex flex-col gap-4",
                      weekday: "text-muted-foreground/80 text-[0.7rem] uppercase tracking-wider",
                      day: "text-sm",
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("billingHistoryEmpty")}</p>
          ) : (
            <div className="divide-y divide-border text-sm">
              <div className="grid grid-cols-1 gap-2 pb-3 text-xs font-semibold text-muted-foreground sm:grid-cols-12">
                <span className="sm:col-span-1 whitespace-nowrap">{t("billingAmount")}</span>
                <span className="sm:col-span-1 whitespace-nowrap">{t("billingStatus")}</span>
                <span className="sm:col-span-1 whitespace-nowrap">{t("billingCredits")}</span>
                <span className="sm:col-span-3">{t("billingPaymentId")}</span>
                <span className="sm:col-span-1 whitespace-nowrap">{t("billingCreatedAt")}</span>
                <span className="sm:col-span-1 whitespace-nowrap">{t("billingExpiresAt")}</span>
                <span className="sm:col-span-4">{t("billingDescription")}</span>
              </div>
              {transactions.map((item) => {
                const description = formatDescription(item.description) || t("billingHistoryItem")
                const paymentId = formatPaymentId(item.order_id, item.transaction_id)
                return (
                  <div key={item.id} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-12">
                    <div className="sm:col-span-1">
                      <p className="whitespace-nowrap">{formatAmount(item.amount, item.currency)}</p>
                    </div>
                    <div className="sm:col-span-1">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{formatStatus(item.status)}</p>
                    </div>
                    <div className="sm:col-span-1">
                      <p className="text-xs whitespace-nowrap">{formatCredits(item.credits, item.status)}</p>
                    </div>
                    <div className="sm:col-span-3">
                      <p className="truncate text-xs text-muted-foreground" title={paymentId}>
                        {paymentId}
                      </p>
                    </div>
                    <div className="sm:col-span-1">
                      <p
                        className="text-xs text-muted-foreground truncate whitespace-nowrap"
                        title={formatDate(item.created_at)}
                      >
                        {formatDateShort(item.created_at)}
                      </p>
                    </div>
                    <div className="sm:col-span-1">
                      <p
                        className="text-xs text-muted-foreground truncate whitespace-nowrap"
                        title={formatOptionalDate(item.expires_at)}
                      >
                        {formatOptionalDateShort(item.expires_at)}
                      </p>
                    </div>
                    <div className="sm:col-span-4">
                      <p className="truncate font-medium" title={description}>
                        {description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Select value={`${pageSize}`} onValueChange={(value) => setPageSize(Number.parseInt(value, 10))}>
          <SelectTrigger className="h-9 w-[120px] !h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {t("historyPageSize")} {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">{t("historyPrev")}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">{t("historyNext")}</span>
        </Button>
      </div>
    </div>
  )
}
