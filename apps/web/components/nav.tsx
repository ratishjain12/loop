'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Zap, RotateCcw, TrendingUp, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/today',    label: "Today's Loop", icon: Zap },
  { href: '/revision', label: 'Revision',      icon: RotateCcw },
  { href: '/progress', label: 'Progress',      icon: TrendingUp },
]

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8" />

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark'
        ? <Sun size={15} strokeWidth={1.75} />
        : <Moon size={15} strokeWidth={1.75} />
      }
    </button>
  )
}

function UserProfile() {
  const { user, isLoaded } = useUser()

  const name = user?.fullName ?? user?.firstName ?? 'Account'
  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-3 min-w-0">
      {/* Clerk UserButton — handles avatar + account dropdown */}
      <div className="shrink-0">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8 rounded-lg',
              userButtonTrigger: 'rounded-lg focus:shadow-none',
            },
          }}
        />
      </div>

      {/* Name + email */}
      <div className="flex flex-col min-w-0 flex-1">
        {isLoaded ? (
          <>
            <span className="text-sm font-medium leading-tight truncate">{name}</span>
            {email && (
              <span className="text-[11px] text-muted-foreground leading-tight truncate mt-0.5">
                {email}
              </span>
            )}
          </>
        ) : (
          <>
            <div className="h-3 w-20 bg-muted rounded animate-pulse mb-1" />
            <div className="h-2.5 w-28 bg-muted rounded animate-pulse" />
          </>
        )}
      </div>
    </div>
  )
}

export function Nav() {
  const pathname = usePathname()

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-56 shrink-0 border-r bg-card z-40">

        {/* Wordmark */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b shrink-0">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-foreground text-background shrink-0">
            <Zap size={13} strokeWidth={2.5} fill="currentColor" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Loop</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 flex-1 px-2 py-3 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-[60%] rounded-full bg-foreground" />
                )}
                <Icon size={15} strokeWidth={active ? 2 : 1.75} className="shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Profile + theme toggle */}
        <div className="px-3 py-3 border-t shrink-0 space-y-1">
          {/* Theme toggle row */}
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          {/* User profile row */}
          <div className="px-1">
            <UserProfile />
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ───────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch h-14 border-t bg-card">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 text-[10px] font-medium transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.75} />
              {label}
            </Link>
          )
        })}
        <div className="flex flex-col items-center justify-center gap-1 px-3">
          <ThemeToggle />
        </div>
      </nav>
    </>
  )
}
