import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PrivacyContent } from "@/components/privacy-content"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <PrivacyContent />

      <Footer />
    </main>
  )
}
