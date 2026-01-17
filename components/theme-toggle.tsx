"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useI18n } from "@/components/i18n-provider"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)
  const triggerId = "theme-toggle-trigger"
  const contentId = "theme-toggle-content"

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentIcon =
    !mounted ? (
      <Monitor className="h-4 w-4" />
    ) : resolvedTheme === "light" ? (
      <Sun className="h-4 w-4" />
    ) : resolvedTheme === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild id={triggerId}>
        <Button variant="outline" size="icon" aria-label={t("theme")}>
          {currentIcon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent id={contentId} align="end" className="w-40">
        <DropdownMenuItem onSelect={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          {t("themeLight")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          {t("themeDark")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          {t("themeSystem")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
