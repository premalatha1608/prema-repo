import { NextRequest, NextResponse } from 'next/server'

// GET /api/teams - Fetch team members (users)
export async function GET(request: NextRequest) {
  try {
    if (process.env.MOCK_API === '1') {
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
      // Handle 401 Unauthorized - return fallback members
      if (response.status === 401) {
        console.warn('[Teams API] Unauthorized (401) - returning fallback members')
        return NextResponse.json({ members: [
          { id: 'alice@example.com', name: 'Alice' },
          { id: 'bob@example.com', name: 'Bob' },
          { id: 'carol@example.com', name: 'Carol' }
        ] })
      }
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
    
    // Fallback to mock members when connection fails (dev-team branch)
    return NextResponse.json({ members: [
      { id: 'alice@example.com', name: 'Alice' },
      { id: 'bob@example.com', name: 'Bob' },
      { id: 'carol@example.com', name: 'Carol' }
    ] })
  }
}
