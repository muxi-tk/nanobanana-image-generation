"use client"

import Link from "next/link"
import { useI18n } from "@/components/i18n-provider"

export function RefundApplicationContent() {
  const { locale } = useI18n()
  const copy =
    locale === "zh"
      ? {
          label: "账单",
          title: "退款申请",
          subtitle: "请根据退款政策页面中的说明提交申请。",
          link: "前往退款申请说明",
        }
      : {
          label: "Billing",
          title: "Refund Application",
          subtitle: "Submit your request using the instructions on the Refund Policy page.",
          link: "Go to refund application instructions",
        }

  return (
    <section className="container mx-auto max-w-4xl px-4 pb-20 pt-12">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{copy.label}</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        <Link href="/refund#application" className="text-foreground hover:underline">
          {copy.link}
        </Link>
      </div>
    </section>
  )
}
