import Link from "next/link"
import { siteConfig } from "@/lib/site"

export function Footer() {
  const supportEmail = siteConfig.supportEmail || "support@nanobananaimg.online"
  const supportEmailLabel = siteConfig.supportEmail || "support@nanobananaimg.online"
  const supportHours = siteConfig.supportHours
  const companyName = siteConfig.companyName
  const companyAddress = siteConfig.companyAddress
  const companyRegistration = siteConfig.companyRegistration

  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto px-4 max-w-7xl">
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>© 2026 nanobananaimg.online. All rights reserved.</p>
          <p>Independent product. Not affiliated with Google or AI model providers.</p>
          {companyName ? <p>{companyName}</p> : null}
          {companyAddress ? <p>{companyAddress}</p> : null}
          {companyRegistration ? <p>{companyRegistration}</p> : null}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/refund" className="hover:text-foreground transition-colors">
              Refund Policy
            </Link>
            <Link href="/refund-application" className="hover:text-foreground transition-colors">
              Refund Application
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
