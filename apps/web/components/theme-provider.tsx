'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// next-themes injects an inline anti-FOUC <script>, which React 19 flags on the
// client with "Encountered a script tag while rendering React component". The
// script runs correctly during SSR, so this is a benign dev-only false positive
// with no upstream fix (next-themes is unmaintained). Scope-filter that one
// message so real script warnings still surface.
// See https://github.com/pacocoursey/next-themes/issues/387
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
      return
    }
    originalError(...args)
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
