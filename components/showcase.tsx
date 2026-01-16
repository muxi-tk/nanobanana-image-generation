"use client"

import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"

export function Showcase() {
  const { locale } = useI18n()
  const copy =
    locale === "zh"
      ? {
          pill: "提示词驱动预览",
          title: "案例展示",
          subtitle: "看看提示词如何改变原图效果",
          badge: "示例输出",
          cta: "试用 Nano Banana 生成器",
          items: [
            {
              title: "山景编辑",
              description: "基于提示词的背景替换与细节调整示例。",
              image: "/majestic-snow-capped-mountain-landscape.jpg",
            },
            {
              title: "花园增强",
              description: "自然语言驱动的调色与场景扩展。",
              image: "/beautiful-garden-with-flowers.jpg",
            },
            {
              title: "海滩光线变化",
              description: "为原图应用氛围与光影调整。",
              image: "/tropical-beach-sunset.png",
            },
            {
              title: "极光叠加",
              description: "根据提示细节进行风格迁移与效果叠加。",
              image: "/images/northern-lights.png",
            },
          ],
        }
      : {
          pill: "Prompt-to-edit previews",
          title: "Showcase",
          subtitle: "See how prompts transform the original image",
          badge: "Example output",
          cta: "Try Nano Banana Generator",
          items: [
            {
              title: "Mountain scene edit",
              description: "Example of background replacement with prompt-driven adjustments.",
              image: "/majestic-snow-capped-mountain-landscape.jpg",
            },
            {
              title: "Garden enhancement",
              description: "Color grading and scene expansion with natural language prompts.",
              image: "/beautiful-garden-with-flowers.jpg",
            },
            {
              title: "Beach lighting shift",
              description: "Atmosphere and lighting changes applied to the original image.",
              image: "/tropical-beach-sunset.png",
            },
            {
              title: "Aurora overlay",
              description: "Style transfer and effect layering based on prompt details.",
              image: "/images/northern-lights.png",
            },
          ],
        }
  return (
    <section id="showcase" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
            <Zap className="h-4 w-4" />
            <span>{copy.pill}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">{copy.title}</h2>
          <p className="text-lg text-muted-foreground text-balance">{copy.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {copy.items.map((item, index) => (
            <Card key={index} className="overflow-hidden group hover:shadow-xl transition-shadow">
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  suppressHydrationWarning
                />
                <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                  {copy.badge}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/generator">{copy.cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
