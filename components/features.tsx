"use client"

import { Sparkles, Users, ImageIcon, Zap, Images, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/components/i18n-provider"

export function Features() {
  const { locale } = useI18n()
  const copy =
    locale === "zh"
      ? {
          title: "核心功能",
          subtitle: "面向真实生产需求的实用 AI 编辑流程。",
          items: [
            {
              icon: Sparkles,
              title: "自然语言编辑",
              description: "用简单文字提示完成图像编辑，配合引导式 AI 辅助。",
            },
            {
              icon: Users,
              title: "角色一致性",
              description: "在多次编辑与变体中保持角色细节一致。",
            },
            {
              icon: ImageIcon,
              title: "场景保留",
              description: "在保留原始场景语境的同时完成修改。",
            },
            {
              icon: Zap,
              title: "一次成片",
              description: "快速迭代，减少手动调整次数。",
            },
            {
              icon: Images,
              title: "多图上下文",
              description: "处理多张图片，保持输出风格一致。",
            },
            {
              icon: TrendingUp,
              title: "AI UGC 生产",
              description: "为社媒与营销流程生成一致的内容资产。",
            },
          ],
        }
      : {
          title: "Core Features",
          subtitle: "A practical AI editing workflow built for real production needs.",
          items: [
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
          ],
        }
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">{copy.title}</h2>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            {copy.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {copy.items.map((feature, index) => (
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
