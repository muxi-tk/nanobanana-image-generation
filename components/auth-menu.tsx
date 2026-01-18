"use client"

import { signInWithGoogle } from "@/app/actions/auth"
import { Logo } from "@/components/logo"
import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sparkles } from "lucide-react"
import { useEffect, useState, type SVGProps } from "react"

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.201 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.275 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 19.016 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.275 4 24 4c-7.682 0-14.354 4.337-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.1 0 9.789-1.963 13.326-5.154l-6.162-5.215C29.114 35.091 26.679 36 24 36c-5.177 0-9.619-3.318-11.279-7.946l-6.522 5.025C9.504 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.239-2.231 4.167-4.139 5.631l.003-.002 6.162 5.215C36.893 39.23 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

export function AuthMenu({
  signInLabel = "Sign In",
  continueWithGoogleLabel = "Continue with Google",
}: {
  signInLabel?: string
  continueWithGoogleLabel?: string
}) {
  const [nextUrl, setNextUrl] = useState("/")
  const { locale } = useI18n()
  const copy =
    locale === "zh"
      ? {
          title: "Nano Banana",
          subtitle: "欢迎回来，继续你的创作",
          trialCta: "免费试用",
        }
      : {
          title: "Nano Banana",
          subtitle: "Welcome back. Pick up where you left off.",
          trialCta: "Start free trial",
        }

  useEffect(() => {
    setNextUrl(`${window.location.pathname}${window.location.search}${window.location.hash}`)
  }, [])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          {signInLabel}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="border border-border bg-popover text-popover-foreground shadow-2xl sm:max-w-md"
        showCloseButton
      >
        <DialogTitle className="sr-only">{copy.title}</DialogTitle>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-2xl font-semibold text-primary">
            <Logo className="h-7 w-7 text-primary" />
            <span>{copy.title}</span>
          </div>
          <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>

        <Button asChild className="mx-auto mt-1 w-full max-w-xs rounded-full">
          <span aria-disabled="true" tabIndex={-1}>
            <Sparkles className="h-4 w-4 text-primary-foreground" />
            {copy.trialCta}
          </span>
        </Button>

        <div className="mt-4 border-t border-border pt-4">
          <form>
            <input type="hidden" name="next" value={nextUrl} />
            <Button
              type="submit"
              formAction={signInWithGoogle}
              variant="outline"
              className="w-full justify-center gap-2"
            >
              <GoogleIcon className="h-5 w-5" />
              {continueWithGoogleLabel}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
