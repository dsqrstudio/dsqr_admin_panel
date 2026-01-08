'use client'

import { useEffect } from 'react'
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
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: 'include',
        })

        if (!response.ok) {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  return <DashboardRoot />
}
