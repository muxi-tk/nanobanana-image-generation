import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { RefundApplicationContent } from "@/components/refund-application-content"

export default function RefundApplicationPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <RefundApplicationContent />

      <Footer />
    </main>
  )
}
