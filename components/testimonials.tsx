import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

const highlights = [
  {
    title: "Consistent character edits",
    description: "Keep facial features and wardrobe aligned across iterations and variants.",
  },
  {
    title: "Scene-aware updates",
    description: "Edit backgrounds or compositions while preserving the original context.",
  },
  {
    title: "Production-friendly workflow",
    description: "Batch revisions, prompt reuse, and quick re-renders for creative teams.",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Why teams use Nano Banana</h2>
          <p className="text-lg text-muted-foreground text-balance">Highlights focused on real workflows</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {highlights.map((item) => (
            <Card key={item.title} className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
