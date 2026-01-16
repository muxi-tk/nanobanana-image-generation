"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"

export function Hero() {
  const { locale } = useI18n()
  const copy =
    locale === "zh"
      ? {
          pill: "文本提示一致编辑",
          titlePrefix: "用文本",
          titleEmphasis: "快速修图",
          description: "使用引导式 AI 流程实现角色一致性、场景修改与高效迭代。",
          primaryCta: "开始编辑",
          secondaryCta: "查看示例",
          bullet1: "一次成片",
          bullet2: "多图支持",
          bullet3: "自然语言",
        }
      : {
          pill: "Consistent edits with text prompts",
          titlePrefix: "Transform Images with",
          titleEmphasis: " Simple Text",
          description:
            "Use a guided AI workflow for character consistency, scene edits, and fast iterations with natural language.",
          primaryCta: "Start Editing",
          secondaryCta: "View Examples",
          bullet1: "One-shot editing",
          bullet2: "Multi-image support",
          bullet3: "Natural language",
        }

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Decorative banana elements */}
      <div className="absolute top-20 left-10 text-6xl opacity-10 rotate-12">🍌</div>
      <div className="absolute bottom-20 right-20 text-8xl opacity-10 -rotate-12">🍌</div>

      <div className="container mx-auto px-4 relative max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span>{copy.pill}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance mb-6">
            {copy.titlePrefix}
            <span className="text-primary">{copy.titleEmphasis}</span>
          </h1>

          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto leading-relaxed">
            {copy.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/generator">
                {copy.primaryCta} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#showcase">{copy.secondaryCta}</Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              {copy.bullet1}
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              {copy.bullet2}
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              {copy.bullet3}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
