"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"

export function Testimonials() {
  const { locale } = useI18n()
  const copy =
    locale === "zh"
      ? {
          title: "产品功能亮点",
          subtitle: "围绕实际创作流程的核心能力",
          items: [
            {
              title: "角色一致性",
              description: "在多次迭代与变体中保持面部与服饰一致。",
            },
            {
              title: "场景感知编辑",
              description: "在保留原始语境的同时调整背景或构图。",
            },
            {
              title: "高效创作流程",
              description: "批量修改、提示词复用与快速重渲，适合高频创作。",
            },
          ],
        }
      : {
          title: "Product highlights",
          subtitle: "Capabilities built for real creative workflows",
          items: [
            {
              title: "Consistent character edits",
              description: "Keep facial features and wardrobe aligned across iterations and variants.",
            },
            {
              title: "Scene-aware edits",
              description: "Edit backgrounds or compositions while preserving the original context.",
            },
            {
              title: "Efficient workflows",
              description: "Batch revisions, prompt reuse, and quick re-renders for fast iteration.",
            },
          ],
        }
  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">{copy.title}</h2>
          <p className="text-lg text-muted-foreground text-balance">{copy.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {copy.items.map((item) => (
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
