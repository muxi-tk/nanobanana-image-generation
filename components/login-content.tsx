"use client"

import Link from "next/link"
import { LoginOptions } from "@/app/login/login-options"
import { Logo } from "@/components/logo"
import { useI18n } from "@/components/i18n-provider"

type LoginContentProps = {
  nextUrl?: string
}

export function LoginContent({ nextUrl }: LoginContentProps) {
  const { locale } = useI18n()
  const copy =
    locale === "zh"
      ? {
          title: "创建你的免费账号",
          subtitle: "登录后即可开始生成图片。",
          termsPrefix: "继续即表示你同意",
          terms: "服务条款",
          privacy: "隐私政策",
          back: "返回首页",
        }
      : {
          title: "Create your free account",
          subtitle: "Sign in to start generating images.",
          termsPrefix: "By continuing, you agree to our",
          terms: "Terms",
          privacy: "Privacy Policy",
          back: "Back to home",
        }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-bold">
        <Logo className="h-9 w-9 text-foreground" />
        <span>Nano Banana</span>
      </Link>

      <div className="w-full rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{copy.subtitle}</p>

        <div className="mt-8">
          <LoginOptions nextUrl={nextUrl} />
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {copy.termsPrefix}{" "}
          <Link href="/terms" className="underline underline-offset-4">
            {copy.terms}
          </Link>{" "}
          {locale === "zh" ? "和" : "and"}{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            {copy.privacy}
          </Link>
          .
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/" className="underline underline-offset-4">
          {copy.back}
        </Link>
      </p>
    </div>
  )
}
