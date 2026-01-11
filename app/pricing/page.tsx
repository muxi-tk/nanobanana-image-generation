import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PricingPlans } from "@/components/pricing-plans"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Sparkles, ShieldCheck, Clock3, ImageIcon, Rocket, Layers, ArrowRight } from "lucide-react"
import { siteConfig } from "@/lib/site"
import { Suspense } from "react"

const billingFaq = [
  {
    question: "How does billing work?",
    answer:
      "Plans are billed through Creem. Choose a plan, complete the Creem checkout, and your subscription activates immediately. You can change or cancel at any time from the Creem customer portal.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Absolutely. Upgrades pro-rate automatically; downgrades take effect on the next billing cycle. If you need a custom seat or credit pack, pick the Studio plan and we’ll tailor it.",
  },
  {
    question: "Which payment methods are supported?",
    answer:
      "Creem handles global payments with cards and local methods. Taxes and compliance are taken care of automatically on your behalf.",
  },
  {
    question: "What is the refund policy?",
    answer:
      "Refunds can be requested within 7 days of purchase if used credits are less than 30% of the total credits in the plan. Contact support for review.",
  },
  {
    question: "How do I contact support?",
    answer: `Email us at ${siteConfig.supportEmail || "support@yourdomain.com"} for account or billing help.`,
  },
]

const guarantee = [
  {
    icon: ShieldCheck,
    title: "Transparent checkout",
    description: "Creem secures payments, taxes, and invoices—no surprise fees.",
  },
  {
    icon: Clock3,
    title: "Cancel anytime",
    description: "Manage your plan instantly from the Creem portal or contact us.",
  },
  {
    icon: ImageIcon,
    title: "Production-ready",
    description: "Fast background replacement, masking, and batch edits without setup.",
  },
]

const capabilities = [
  {
    icon: Rocket,
    title: "Built for speed",
    description: "Optimized for rapid prompts with live previews and smart defaults.",
  },
  {
    icon: Layers,
    title: "Team-friendly",
    description: "Share presets, approvals, and output styles in one workspace.",
  },
  {
    icon: Sparkles,
    title: "Creative control",
    description: "Fine-tune lighting, masking, and fills with AI assistance.",
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section id="plans" className="container mx-auto max-w-6xl px-4 pb-12 pt-8">
        <Suspense fallback={<div className="py-6 text-center text-sm text-muted-foreground">Loading plans...</div>}>
          <PricingPlans />
        </Suspense>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {guarantee.map((item) => (
            <Card key={item.title} className="p-4">
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-16 sm:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div className="space-y-4">
              <Badge variant="outline" className="border-primary/30 bg-white">
                What you get
              </Badge>
              <h3 className="text-3xl font-bold tracking-tight">Every plan includes</h3>
              <p className="text-lg text-muted-foreground">
                From solo creators to production teams, you get the same production-ready editing stack—just choose how
                much capacity you need.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {capabilities.map((item) => (
                  <Card key={item.title} className="p-4">
                    <div className="flex items-start gap-3">
                      <item.icon className="mt-1 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <Card className="p-6">
              <h4 className="text-lg font-semibold">Highlights</h4>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-1 h-4 w-4 text-primary" />
                  Background replacement, smart masking, and text-to-image fills.
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-1 h-4 w-4 text-primary" />
                  Batch processing with presets so every export stays on-brand.
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-1 h-4 w-4 text-primary" />
                  Creem-powered billing, invoices, and tax handling out of the box.
                </li>
              </ul>
              <Separator className="my-6" />
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">GDPR-friendly, secure payments, and instant provisioning.</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-background py-16 sm:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">FAQ</p>
            <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">Billing and account questions</h3>
            <p className="text-muted-foreground">
              Everything you need to know about plans and Creem-powered checkout.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {billingFaq.map((item) => (
              <AccordionItem
                key={item.question}
                value={item.question}
                className="border border-border/50 rounded-lg px-3 bg-background/60 last:border-b"
              >
                <AccordionTrigger className="text-left text-base font-semibold">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </main>
  )
}
