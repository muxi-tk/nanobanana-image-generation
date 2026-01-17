"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CreditCard, History, PanelLeftIcon, Sparkles } from "lucide-react"
import { BillingContent } from "@/components/billing-content"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { useI18n } from "@/components/i18n-provider"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function SidebarLogoToggle() {
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const tooltipHidden = !isCollapsed
  const tooltip = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleSidebar}
          className="relative inline-flex size-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
          aria-label="Toggle Sidebar"
        >
          <Logo className="absolute inset-0 m-auto h-4 w-4 text-foreground transition-opacity group-data-[collapsible=icon]:block group-data-[collapsible=icon]:group-hover:opacity-0" />
          <PanelLeftIcon className="absolute inset-0 m-auto hidden h-4 w-4 text-foreground opacity-0 transition-opacity group-data-[collapsible=icon]:block group-data-[collapsible=icon]:group-hover:opacity-100" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={tooltipHidden}>
        打开边栏
      </TooltipContent>
    </Tooltip>
  )
  if (!isCollapsed) {
    return (
      <>
        <div className="flex items-center">
          <Logo className="h-4 w-4 text-foreground" />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="inline-flex" />
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            关闭边栏
          </TooltipContent>
        </Tooltip>
      </>
    )
  }
  return tooltip
}

export function BillingClient() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        collapsible="icon"
        className="border-border/60 bg-sidebar/60 top-16 h-[calc(100svh-4rem)] group"
      >
        <SidebarHeader className="border-sidebar-border gap-4 border-b px-4 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
          <div className="flex w-full items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
            <SidebarLogoToggle />
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t("generateImage")}
                isActive={pathname === "/generator"}
                className="sidebar-ripple group group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:[&>span]:hidden"
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
                className="sidebar-ripple group group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:[&>span]:hidden"
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
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t("billingNav")}
                isActive={pathname === "/billing"}
                className="sidebar-ripple group group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:[&>span]:hidden"
                asChild
              >
                <Link href="/billing">
                  <CreditCard
                    className={cn(
                      "text-muted-foreground group-hover:text-sidebar-accent-foreground group-data-[active=true]:text-sidebar-accent-foreground",
                      pathname === "/billing" && "text-sidebar-accent-foreground"
                    )}
                  />
                  <span>{t("billingNav")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarRail />
      <SidebarInset className="bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-8 py-20">
            <BillingContent />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
