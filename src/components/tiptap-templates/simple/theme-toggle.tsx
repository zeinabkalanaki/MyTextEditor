import { useEffect, useRef, useState } from "react"

import { Button } from "../../tiptap-ui-primitive/button"
import { MoonStarIcon } from "../../tiptap-icons/moon-star-icon"
import { SunIcon } from "../../tiptap-icons/sun-icon"

export function ThemeToggle() {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false

    return (
      !!document.querySelector('meta[name="color-scheme"][content="dark"]') ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
    )
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDarkMode(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

useEffect(() => {
  const wrapper = buttonRef.current?.closest(".simple-editor-wrapper")
  if (!wrapper) return

  const root = document.documentElement
  const wrapperWasDark = wrapper.classList.contains("dark")
  const rootWasDark = root.classList.contains("dark")

  wrapper.classList.toggle("dark", isDarkMode)
  root.classList.toggle("dark", isDarkMode)

  return () => {
    wrapper.classList.toggle("dark", wrapperWasDark)
    root.classList.toggle("dark", rootWasDark)
  }
}, [isDarkMode])


  const toggleDarkMode = () => setIsDarkMode((isDark) => !isDark)

  return (
    <Button
      ref={buttonRef}
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      variant="ghost"
    >
      {isDarkMode ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  )
}
