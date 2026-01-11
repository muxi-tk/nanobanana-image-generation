import { Sparkles, Users, ImageIcon, Zap, Images, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"

const features = [
  {
    icon: Sparkles,
    title: "Natural Language Editing",
    description: "Edit images using simple text prompts with guided AI assistance.",
  },
  {
    icon: Users,
    title: "Character Consistency",
    description: "Maintain character details across edits and variations.",
  },
  {
    icon: ImageIcon,
    title: "Scene Preservation",
    description: "Blend edits with original backgrounds while keeping context intact.",
  },
  {
    icon: Zap,
    title: "One-Shot Editing",
    description: "Quick iterations that reduce the number of manual passes.",
  },
  {
    icon: Images,
    title: "Multi-Image Context",
    description: "Process multiple images to keep outputs aligned across a set.",
  },
  {
    icon: TrendingUp,
    title: "AI UGC Creation",
    description: "Create consistent assets for social media and marketing workflows.",
  },
]

export function Features() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Core Features</h2>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            A practical AI editing workflow built for real production needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
