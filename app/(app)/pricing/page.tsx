import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PricingContent } from "@/components/pricing-content"

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <PricingContent />
      <Footer />
    </main>
  )
}
