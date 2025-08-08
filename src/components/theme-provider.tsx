"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Helper function to safely access localStorage
const getStoredTheme = (storageKey: string): Theme | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(storageKey) as Theme
  } catch (error) {
    console.warn('Could not access localStorage:', error)
    return null
  }
}

// Helper function to safely set localStorage
const setStoredTheme = (storageKey: string, theme: Theme): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey, theme)
  } catch (error) {
    console.warn('Could not save theme to localStorage:', error)
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vapi-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get theme from localStorage after component mounts
    const storedTheme = getStoredTheme(storageKey)
    if (storedTheme) {
      setTheme(storedTheme)
    }
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    // Prevent flash by applying theme immediately
    if (!mounted) {
      // Apply default theme immediately to prevent flash
      const initialTheme = getStoredTheme(storageKey) || defaultTheme
      const effectiveTheme = initialTheme === "system" 
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : initialTheme
      
      root.classList.remove("light", "dark")
      root.classList.add(effectiveTheme)
      return
    }

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme, mounted, storageKey, defaultTheme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      if (mounted) {
        setStoredTheme(storageKey, theme)
      }
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
} 