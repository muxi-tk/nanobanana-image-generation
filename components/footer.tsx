"use client"

import Link from "next/link"
import { siteConfig } from "@/lib/site"
import { useI18n } from "@/components/i18n-provider"

export function Footer() {
  const { locale } = useI18n()
  const copy =
    locale === "zh"
      ? {
          rights: "© 2026 nanobananaimg.online. 保留所有权利。",
          disclaimer: "独立产品，与 Google 或 AI 模型提供方无关联。",
          privacy: "隐私政策",
          terms: "服务条款",
        }
      : {
          rights: "© 2026 nanobananaimg.online. All rights reserved.",
          disclaimer: "Independent product. Not affiliated with Google or AI model providers.",
          privacy: "Privacy Policy",
          terms: "Terms of Service",
        }
  const companyName = siteConfig.companyName
  const companyAddress = siteConfig.companyAddress
  const companyRegistration = siteConfig.companyRegistration

  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto px-4 max-w-7xl">
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>{copy.rights}</p>
          <p>{copy.disclaimer}</p>
          {companyName ? <p>{companyName}</p> : null}
          {companyAddress ? <p>{companyAddress}</p> : null}
          {companyRegistration ? <p>{companyRegistration}</p> : null}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {copy.privacy}
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {copy.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
