"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { defaultLocale, getTranslation, type Locale, type TranslationKey } from "@/lib/i18n"

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    const stored = window.localStorage.getItem("nb_locale")
    if (stored === "en" || stored === "zh") {
      setLocaleState(stored)
      document.documentElement.lang = stored
    } else {
      document.documentElement.lang = defaultLocale
    }
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem("nb_locale", next)
    document.documentElement.lang = next
  }, [])

  const t = useCallback(
    (key: TranslationKey) => getTranslation(locale, key),
    [locale]
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.")
  }
  return context
}
