import { NextRequest, NextResponse } from 'next/server'

const DOCTYPE = "Request Tickets"

// POST /api/tickets/[id]/accept - Accept ticket with rating
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { level, notes } = body
    
    console.log('Accept API - Received data:', { level, notes })
    
    if (!level) {
      return NextResponse.json({ error: 'Level is required' }, { status: 400 })
    }


    // Get current ticket data
    const getUrl = `https://zeff.valuepitch.ai/api/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(params.id)}`
    const getResponse = await fetch(getUrl, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json'
      }
    })

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch ticket: ${getResponse.status}`)
    }

    const currentTicket = await getResponse.json()
    const currentData = currentTicket.data

    // Convert level to rating
    const levelToRating = {
      'L1': 0.2,
      'L2': 0.4,
      'L3': 0.6,
      'L4': 0.8,
      'L5': 1.0
    }
    const rating = levelToRating[level as keyof typeof levelToRating] || 0.2

    // Update action_status array
    let rows = Array.isArray(currentData.action_status) ? currentData.action_status : []
    const nowISO = new Date().toISOString().slice(0, 19).replace("T", " ")

    rows.push({
      status: "Accepted",
      rating: rating,
      status_update_latest_time: nowISO,
      updated_by: currentData.raised_by, // You might want to get this from session
      notes: notes || ""
    })

    // Update ticket
    const updateData = {
      status: "Accepted",
      status_update_latest_time: nowISO,
      action_status: rows
    }

    const updateUrl = `https://zeff.valuepitch.ai/api/resource/${encodeURIComponent(DOCTYPE)}/${encodeURIComponent(params.id)}`
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json()
      throw new Error(`Frappe API error: ${JSON.stringify(errorData)}`)
    }

    const data = await updateResponse.json()
    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error accepting ticket:', error)
    return NextResponse.json({ error: 'Failed to accept ticket' }, { status: 500 })
  }
}
