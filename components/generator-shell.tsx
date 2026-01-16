"use client"

import Link from "next/link"
import { History, Sparkles } from "lucide-react"
import { usePathname } from "next/navigation"
import { ImageGenerator } from "@/components/image-generator"
import { Logo } from "@/components/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useI18n } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"

type GeneratorShellProps = {
  header?: never
}

export function GeneratorShell({ header }: GeneratorShellProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        collapsible="icon"
        className="border-border/60 bg-sidebar/60 top-16 h-[calc(100svh-4rem)]"
      >
        <SidebarHeader className="border-sidebar-border gap-4 border-b px-4 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
          <div className="flex w-full items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
            <Link href="/" className="flex items-center gap-3">
              <Logo className="h-8 w-8 text-foreground" />
              <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold">Nano Banana</span>
                <span className="text-xs text-muted-foreground">{t("aiGenerator")}</span>
              </div>
            </Link>
            <SidebarTrigger className="inline-flex" />
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t("generateImage")}
                isActive={pathname === "/generator"}
                className="sidebar-ripple group"
                asChild
              >
                <Link href="/generator">
                  <Sparkles
                    className={cn(
                      "text-muted-foreground group-hover:text-sidebar-accent-foreground group-data-[active=true]:text-sidebar-accent-foreground",
                      pathname === "/generator" && "text-sidebar-accent-foreground"
                    )}
                  />
                  <span>{t("generateImage")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t("historyNav")}
                isActive={pathname === "/history"}
                className="sidebar-ripple group"
                asChild
              >
                <Link href="/history">
                  <History
                    className={cn(
                      "text-muted-foreground group-hover:text-sidebar-accent-foreground group-data-[active=true]:text-sidebar-accent-foreground",
                      pathname === "/history" && "text-sidebar-accent-foreground"
                    )}
                  />
                  <span>{t("historyNav")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarRail />
      <SidebarInset className="bg-muted/30">
        <div className="min-h-svh">
          <ImageGenerator />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
