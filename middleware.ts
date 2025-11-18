import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://zeff-dev.netlify.app'
]

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const origin = request.headers.get('origin')
    const isAllowedOrigin = origin && allowedOrigins.includes(origin)
    
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })
      
      if (isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        response.headers.set('Access-Control-Max-Age', '86400')
      }
      
      return response
    }
    
    // Handle actual requests
    const response = NextResponse.next()
    
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}

