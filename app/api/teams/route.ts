import { NextRequest, NextResponse } from 'next/server'

// GET /api/teams - Fetch team members (users)
export async function GET(request: NextRequest) {
  try {
    // Only allow MOCK_API in development mode
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (process.env.MOCK_API === '1' && isDevelopment) {
      return NextResponse.json({ members: [ 'alice@example.com', 'bob@example.com', 'carol@example.com' ] })
    }

    // Fetch users with both id and full name
    const frappeUrl = `https://zeff.valuepitch.ai/api/resource/User?fields=["name","full_name"]&limit=0`
    
    // Forward Frappe session; prefer persisted frappe_sid
    const cookiesHeader = request.headers.get('cookie') || ''
    const frappeSid = request.cookies.get('frappe_sid')?.value
    const forwardCookie = frappeSid ? `sid=${frappeSid}` : cookiesHeader

    const response = await fetch(frappeUrl, {
      headers: {
        'Cookie': forwardCookie,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Frappe API error: ${response.status}`)
    }

    const data = await response.json()
    const members = Array.isArray(data?.data)
      ? data.data
          .map((u: any) => ({ id: u.name, name: u.full_name || u.name }))
          .filter((u: any) => u && u.id && u.name)
      : []
    return NextResponse.json({ members })

  } catch (error) {
    console.error('Error fetching teams:', error)
    
    // In production, return empty array instead of mock data
    // In development, allow fallback to mock data for testing
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (isDevelopment && process.env.MOCK_API === '1') {
      return NextResponse.json({ members: [
        { id: 'alice@example.com', name: 'Alice' },
        { id: 'bob@example.com', name: 'Bob' },
        { id: 'carol@example.com', name: 'Carol' }
      ] })
    }
    
    // Production: return empty array to avoid showing mock data
    return NextResponse.json({ members: [] })
  }
}
