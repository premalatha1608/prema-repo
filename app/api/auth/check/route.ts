import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Short-circuit for local/dev mocks
    if (process.env.MOCK_API === '1') {
      return NextResponse.json({ message: 'manvitha@valuepitch.com' })
    }

    // Prefer our same-origin persisted Frappe SID and forward it as `sid`
    const incomingCookies = request.headers.get('cookie') || ''
    const frappeSid = request.cookies.get('frappe_sid')?.value
    const forwardCookie = frappeSid ? `sid=${frappeSid}` : incomingCookies

    const response = await fetch('https://zeff.valuepitch.ai/api/method/frappe.auth.get_logged_user', {
      method: 'GET',
      headers: {
        'Cookie': forwardCookie,
      },
    })

    // If Frappe doesn't respond OK, treat as Guest instead of failing with 500
    if (!response.ok) {
      return NextResponse.json({ message: 'Guest' })
    }

    const data = await response.json().catch(() => ({} as any))
    // Normalize to { message: <user or Guest> }
    const normalized = typeof data?.message === 'string' && data.message.trim()
      ? { message: data.message }
      : { message: 'Guest' }
    
    // Forward the response with cookies
    const nextResponse = NextResponse.json(normalized)
    
    // Copy cookies from Frappe response to Next.js response
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader)
      // Also persist the Frappe SID for subsequent API calls
      const sidMatch = setCookieHeader.match(/sid=([^;]+)/)
      if (sidMatch && sidMatch[1]) {
        nextResponse.cookies.set('frappe_sid', sidMatch[1], {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })
      }
    }
    
    return nextResponse
  } catch (error) {
    // On network or other errors, don't 500 - return Guest
    return NextResponse.json({ message: 'Guest' })
  }
}

