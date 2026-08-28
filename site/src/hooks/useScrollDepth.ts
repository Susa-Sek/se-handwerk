import { useEffect } from 'react'
import { trackEvent } from '../lib/analytics'

// Meldet die maximal erreichte Scrolltiefe (25/50/75/100 %) einmalig an GA4.
// trackEvent ist consent-gated – ohne Einwilligung passiert nichts.
// Setzt sich bei Routenwechsel zurück, damit jede Seite eigene Werte liefert.
const MARKS = [25, 50, 75, 100] as const

export function useScrollDepth(pathname: string): void {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const fired = new Set<number>()

    const check = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable <= 0) return
      const pct = (window.scrollY / scrollable) * 100
      for (const m of MARKS) {
        if (pct >= m && !fired.has(m)) {
          fired.add(m)
          trackEvent('scroll', { percent_scrolled: m })
        }
      }
    }

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        check()
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    check()
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])
}
