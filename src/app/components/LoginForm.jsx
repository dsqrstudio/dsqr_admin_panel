'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { FiEye, FiEyeOff } from 'react-icons/fi'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        setError(data.message || 'Invalid email or password')
        return
      }

      // Mark session and go to home (dashboard at "/")
      try {
        sessionStorage.setItem('dsqr_logged_in', '1')
      } catch {}

      // TEMPORARY: send a fetch with custom header to set dashboard access
      fetch('/', { headers: { 'x-dsqr-logged-in': '1' } })

      window.location.href = '/'
    } catch (err) {
      setLoading(false)
      setError('Network error. Please try again.')
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 via-gray-200 to-gray-400
 px-4"
    >
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl shadow-lg bg-white">
        {/* Left section: form */}
        <div className="flex flex-1 flex-col justify-center px-8 py-12 md:px-16">
          <div className="mb-8 flex items-center gap-3">
            <Image
              src="/dsqr_logo.png" // <-- your logo file in public folder
              alt="DSQR Logo"
              width={48}
              height={48}
              className="rounded-md object-contain"
            />
            <h1 className="text-2xl font-semibold text-gray-900">DSQR Admin</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-900">Welcome Back 👋</h2>
          <p className="mt-2 mb-8 text-gray-500">
            Sign in to manage and update DSQR content.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dsqr.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 outline-none transition focus:border-[#cff000] focus:ring-1 focus:ring-[#cff000]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-12 text-gray-900 outline-none transition focus:border-[#cff000] focus:ring-1 focus:ring-[#cff000]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#cff000] py-3 font-semibold text-black shadow-md transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} DSQR Admin Dashboard
          </p>
        </div>

        {/* Right section: logo / background */}
        <div className="hidden flex-1 items-center justify-center bg-linear-to-br from-black to-gray-900 md:flex">
          <div className="flex flex-col items-center text-center text-white">
            <Image
              src="/dsqr_logo.png" // same logo from public
              alt="DSQR Logo"
              width={180}
              height={180}
              className="object-contain"
            />
            <h2 className="mt-6 text-3xl font-semibold tracking-tight">
              Welcome to DSQR Studio
            </h2>
            <p className="mt-2 text-gray-300 text-sm max-w-xs">
              Manage graphics, videos, testimonials, and pricing all in one
              clean dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
