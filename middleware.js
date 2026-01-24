import { NextResponse } from 'next/server'

export function middleware(req) {
  const token = req.cookies.get('dsqr_token')?.value
  const { pathname } = req.nextUrl

  // 1. Skip assets/internal
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // 2. Already logged in? Don't show login page
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // 3. Protected route: check token
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    if (!token) {
      const response = NextResponse.redirect(new URL('/login', req.url))
      // FORCE Vercel not to cache this redirect
      response.headers.set('x-middleware-cache', 'no-cache')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}