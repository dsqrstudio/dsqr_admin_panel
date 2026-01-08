// middleware.js (root)
import { NextResponse } from 'next/server'

export function middleware(req) {
  const url = req.nextUrl.clone()
  const { pathname } = url
  const token = req.cookies.get('dsqr_token')?.value // must match backend COOKIE_NAME

  // TEMPORARY WORKAROUND: allow dashboard if sessionStorage 'dsqr_logged_in' is set (set by LoginForm)
  // This only works on the client, so we check for a custom header sent from the client
  const loggedInHeader = req.headers.get('x-dsqr-logged-in')

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets')
  ) {
    return NextResponse.next()
  }

  // Public route: /login (but if already logged-in, send to "/")
  if (pathname.startsWith('/login')) {
    if (token) {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Normalize: hide "/dashboard" URL, always use "/"
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Protect the home (dashboard) route: verify token server-side when present
  if (pathname === '/') {
    if (!token && loggedInHeader !== '1') {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    if (token) {
      // Optional: validate token with backend to prevent stale/forged cookies
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      return fetch(`${API_BASE}/api/auth/me`, {
        headers: { cookie: `dsqr_token=${token}; Path=/` },
      })
        .then((r) => {
          if (r.status === 200) return NextResponse.next()
          url.pathname = '/login'
          return NextResponse.redirect(url)
        })
        .catch(() => {
          url.pathname = '/login'
          return NextResponse.redirect(url)
        })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

// Run on most paths; exclude _next/static, _next/image, and common assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|assets|api).*)',
  ],
}
