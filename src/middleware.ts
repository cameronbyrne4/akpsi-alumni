import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public paths that don't require authentication
const publicPaths = ['/login']

// Define admin-only paths
const adminPaths = ['/admin', '/update-alumni']

// Define the home/default authenticated path
const homePath = '/'

// Helper function to check if a path is public
const isPublicPath = (path: string) => {
  return publicPaths.some(publicPath => path === publicPath)
}

// Helper function to check if a path is admin-only
const isAdminPath = (path: string) => {
  return adminPaths.some(adminPath => path.startsWith(adminPath))
}

// Helper function to create a redirect response
const createRedirectResponse = (url: string, request: NextRequest) => {
  const response = NextResponse.redirect(new URL(url, request.url))
  // Preserve any existing cookies in the redirect
  request.cookies.getAll().forEach(cookie => {
    response.cookies.set(cookie.name, cookie.value, {
      path: '/',
      sameSite: 'strict'
    })
  })
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Get authentication status and user role from cookies
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true'
  const userRole = request.cookies.get('userRole')?.value

  // Debug logging
  console.log('Middleware:', {
    pathname,
    isPublicPath: isPublicPath(pathname),
    isAdminPath: isAdminPath(pathname),
    isAuthenticated,
    userRole,
    cookies: request.cookies.getAll()
  })

  // Handle public paths (like /login)
  if (isPublicPath(pathname)) {
    if (isAuthenticated) {
      // Authenticated user trying to access login page -> redirect to home
      return createRedirectResponse(homePath, request)
    }
    // Unauthenticated user on public path -> allow access
    return NextResponse.next()
  }

  // Handle admin paths
  if (isAdminPath(pathname)) {
    if (!isAuthenticated) {
      // Unauthenticated user trying to access admin path -> redirect to login
      return createRedirectResponse('/login', request)
    }
    if (userRole !== 'admin') {
      // Non-admin user trying to access admin path -> redirect to home
      return createRedirectResponse(homePath, request)
    }
  }

  // Handle protected paths
  if (!isAuthenticated) {
    // Unauthenticated user trying to access protected path -> redirect to login
    return createRedirectResponse('/login', request)
  }

  // Authenticated user accessing allowed path -> allow access
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}