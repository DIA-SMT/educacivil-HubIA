'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

/** Rutas con estética propia oscura: no cambian con el botón de tema. */
function isAlwaysDark(pathname: string | null) {
  return !!pathname && (pathname === '/login' || pathname.startsWith('/admin'))
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname()
  return (
    <NextThemesProvider {...props} forcedTheme={isAlwaysDark(pathname) ? 'dark' : props.forcedTheme}>
      {children}
    </NextThemesProvider>
  )
}
