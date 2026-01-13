"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDays,
  Download,
  History,
  Sparkles,
  LayoutGrid,
  List,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { cn } from "@/lib/utils"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useI18n } from "@/components/i18n-provider"

type HistoryRecord = {
  id: string
  created_at: string
  prompt: string | null
  image_urls: string[] | null
  model: string | null
  aspect_ratio: string | null
  resolution: string | null
  output_format: string | null
  generation_mode: string | null
}

type HistoryImage = {
  id: string
  url: string
  createdAt: string
  prompt: string
  model?: string | null
  generationMode?: string | null
  resolution?: string | null
  aspectRatio?: string | null
  outputFormat?: string | null
}

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown date"
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const modelLabels: Record<string, string> = {
  "nano-banana": "Nano Banana",
  "nano-banana-pro": "Nano Banana Pro",
  "seedream-4-5": "Seedream 4.5",
}

const getPromptTitle = (value: string | null | undefined, fallback: string) => {
  const prompt = value?.trim()
  if (!prompt) {
    return fallback
  }
  return prompt.length > 80 ? `${prompt.slice(0, 80)}...` : prompt
}

export function HistoryClient() {
  const pathname = usePathname()
  const [items, setItems] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedImage, setSelectedImage] = useState<HistoryImage | null>(null)
  const { t } = useI18n()

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/history", { cache: "no-store" })
        if (res.status === 401) {
          setItems([])
          setError(t("historyUnauthorized"))
          return
        }
        if (!res.ok) {
          setError(t("historyError"))
          setItems([])
          return
        }
        const data = (await res.json().catch(() => null)) as { items?: HistoryRecord[] } | null
        setItems(Array.isArray(data?.items) ? data.items : [])
      } catch (err) {
        console.error("History fetch failed", err)
        setError(t("historyError"))
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [t])

  const flattened = useMemo<HistoryImage[]>(() => {
    return items.flatMap((item) => {
      const urls = Array.isArray(item.image_urls) ? item.image_urls : []
      return urls.map((url, index) => ({
        id: `${item.id}-${index}`,
        url,
        createdAt: item.created_at,
        prompt: item.prompt ?? "",
        model: item.model,
        generationMode: item.generation_mode,
        resolution: item.resolution,
        aspectRatio: item.aspect_ratio,
        outputFormat: item.output_format,
      }))
    })
  }, [items])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const now = Date.now()
    const cutoffDays =
      dateFilter === "7"
        ? 7
        : dateFilter === "30"
          ? 30
          : null

    return flattened.filter((item) => {
      if (query && !item.prompt.toLowerCase().includes(query)) {
        return false
      }
      if (typeFilter !== "all" && item.generationMode !== typeFilter) {
        return false
      }
      if (cutoffDays) {
        const created = new Date(item.createdAt).getTime()
        if (Number.isNaN(created)) {
          return false
        }
        const deltaDays = (now - created) / (1000 * 60 * 60 * 24)
        if (deltaDays > cutoffDays) {
          return false
        }
      }
      return true
    })
  }, [dateFilter, flattened, search, typeFilter])

  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        collapsible="icon"
        className="border-border/60 bg-sidebar/60 top-16 h-[calc(100svh-4rem)]"
      >
        <SidebarHeader className="border-sidebar-border gap-4 border-b px-4 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
          <div className="flex w-full items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/prism.png" alt="Nano Banana logo" width={32} height={32} className="h-8 w-8" />
              <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold">Nano Banana</span>
                <span className="text-xs text-muted-foreground">AI Generator</span>
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
                className="sidebar-ripple"
                asChild
              >
                <Link href="/generator">
                  <Sparkles className={cn(pathname === "/generator" ? "text-amber-500" : "text-muted-foreground")} />
                  <span>{t("generateImage")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t("historyNav")}
                isActive={pathname === "/history"}
                className="sidebar-ripple"
                asChild
              >
                <Link href="/history">
                  <History className={cn(pathname === "/history" ? "text-amber-500" : "text-muted-foreground")} />
                  <span>{t("historyNav")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarRail />
      <SidebarInset className="bg-muted/30">
        <div className="flex min-h-svh flex-col gap-8 px-6 py-10 lg:px-10">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground">{t("historyTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("historySubtitle")}</p>
          </header>

          <div className="space-y-6">
              <Card className="border-border/60 bg-white/90 p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t("historySearch")}
                      className="h-11 pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="h-11 w-[150px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("historyTypeAll")}</SelectItem>
                        <SelectItem value="image-edit">{t("historyTypeImageEdit")}</SelectItem>
                        <SelectItem value="text-to-image">{t("historyTypeText")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="h-11 w-[150px]">
                        <SelectValue placeholder="Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("historyDateAll")}</SelectItem>
                        <SelectItem value="7">{t("historyDate7")}</SelectItem>
                        <SelectItem value="30">{t("historyDate30")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(viewMode === "grid" && "bg-muted")}
                        onClick={() => setViewMode("grid")}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(viewMode === "list" && "bg-muted")}
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {loading ? (
                <Card className="border-border/60 bg-white/90 p-10 text-center text-sm text-muted-foreground">
                  {t("historyLoad")}
                </Card>
              ) : error ? (
                <Card className="border-border/60 bg-white/90 p-10 text-center text-sm text-muted-foreground">
                  {error}
                </Card>
              ) : filtered.length === 0 ? (
                <Card className="border-border/60 bg-white/90 p-8 shadow-sm">
                  <Empty className="border border-dashed border-border/60 bg-muted/40">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <History className="h-6 w-6" />
                      </EmptyMedia>
                      <EmptyTitle>{t("historyEmptyTitle")}</EmptyTitle>
                      <EmptyDescription>{t("historyEmptyDesc")}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </Card>
              ) : viewMode === "list" ? (
                <div className="space-y-3">
                  {filtered.map((item) => {
                    const title = getPromptTitle(item.prompt, formatDate(item.createdAt))
                    return (
                      <Card key={item.id} className="border-border/60 bg-white/90 p-4 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            className="h-24 w-full overflow-hidden rounded-lg border border-border/60 sm:h-20 sm:w-32"
                            onClick={() => setSelectedImage(item)}
                          >
                            <img src={item.url} alt={title} className="h-full w-full object-cover" />
                          </button>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold text-foreground">{title}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(item.createdAt)}
                              </span>
                              {item.model ? <span>{modelLabels[item.model] ?? item.model}</span> : null}
                              {item.resolution ? <span>{item.resolution.toUpperCase()}</span> : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedImage(item)}>
                              {t("historyView")}
                            </Button>
                            <Button asChild size="sm" className="bg-amber-200 text-amber-900 hover:bg-amber-300">
                              <a href={item.url} download="nano-banana.png">
                                <Download className="h-4 w-4" />
                                {t("historyDownload")}
                              </a>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((item) => {
                    const title = getPromptTitle(item.prompt, formatDate(item.createdAt))
                    return (
                      <Card key={item.id} className="group overflow-hidden border-border/60 bg-white/95 shadow-sm">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img src={item.url} alt={title} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedImage(item)}
                            >
                              {t("historyView")}
                            </Button>
                            <Button asChild size="sm" className="bg-amber-200 text-amber-900 hover:bg-amber-300">
                              <a href={item.url} download="nano-banana.png">
                                <Download className="h-4 w-4" />
                                {t("historyDownload")}
                              </a>
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 p-4">
                          <p className="line-clamp-2 text-sm font-semibold text-foreground">{title}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(item.createdAt)}
                            </span>
                            {item.model ? <span>{modelLabels[item.model] ?? item.model}</span> : null}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
          </div>
        </div>
      </SidebarInset>

      <Dialog open={Boolean(selectedImage)} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Generated Image</DialogTitle>
          </DialogHeader>
          {selectedImage ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                <img
                  src={selectedImage.url}
                  alt={getPromptTitle(selectedImage.prompt, formatDate(selectedImage.createdAt))}
                  className="w-full object-contain"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {getPromptTitle(selectedImage.prompt, formatDate(selectedImage.createdAt))}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(selectedImage.createdAt)}</p>
                </div>
                <Button asChild className="bg-amber-200 text-amber-900 hover:bg-amber-300">
                  <a href={selectedImage.url} download="nano-banana.png">
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
