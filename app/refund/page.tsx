import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { RefundContent } from "@/components/refund-content"

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <RefundContent />

      <Footer />
    </main>
  )
}
