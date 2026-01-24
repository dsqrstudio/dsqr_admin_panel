'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardRoot from './components/DashboardRoot'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Client-side authentication check
    const checkAuth = async () => {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        console.log('[Home] Checking auth, cookies:', document.cookie)
        // Send JWT in Authorization header
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('dsqr_token')
            : null
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        console.log(
          '[Home] /api/auth/me response',
          response.status,
          Object.fromEntries(response.headers.entries())
        )
        if (!response.ok) {
          console.log('[Home] Not authenticated, redirecting to /login')
          router.replace('/login')
          return
        }
        const data = await response.json()
        console.log('[Home] /api/auth/me data', data)
        if (!data.user || !data.user.email) {
          console.log('[Home] No user in data, redirecting to /login')
          router.replace('/login')
        }
      } catch (error) {
        console.error('[Home] Auth check error', error)
        router.replace('/login')
      }
    }

    checkAuth()
  }, [router])

  return <DashboardRoot />
}
