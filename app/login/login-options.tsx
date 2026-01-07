"use client"

import { signInWithGoogle } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { SVGProps } from "react"

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

export function LoginOptions({ nextUrl }: { nextUrl?: string }) {
  return (
    <div className="space-y-6">
      <form>
        <input type="hidden" name="next" value={nextUrl || "/"} />
        <Button
          type="submit"
          formAction={signInWithGoogle}
          variant="outline"
          className="w-full justify-center gap-2 rounded-full h-11"
        >
          <GoogleIcon className="h-5 w-5" />
          Continue with Google
        </Button>
      </form>

      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <div className="space-y-3">
        <Input placeholder="Enter email address" disabled />
        <Button className="w-full rounded-full h-11" disabled>
          Continue
        </Button>
      </div>
    </div>
  )
}
