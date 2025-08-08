import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { updateCallHistory, getCallHistory, getCallHistoryStats } from '@/lib/database'

const VAPI_BASE_URL = 'https://api.vapi.ai'
const VAPI_API_KEY = process.env.VAPI_API_KEY

if (!VAPI_API_KEY) {
  throw new Error('VAPI_API_KEY environment variable is required')
}

// Fetch calls from Vapi API for a specific assistant
async function fetchCallsFromVapi(assistantId: string, limit: number = 100, createdAtGt?: string) {
  try {
    const params = new URLSearchParams({
      assistantId,
      limit: limit.toString(),
      ...(createdAtGt && { createdAtGt })
    })

    const response = await fetch(`${VAPI_BASE_URL}/call?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Vapi API error:', response.status, response.statusText)
      return []
    }

    const data = await response.json()
    return data.calls || []
  } catch (error) {
    console.error('Error fetching calls from Vapi:', error)
    return []
  }
}

// Fetch transcript for a specific call
async function fetchCallTranscript(callId: string) {
  try {
    const response = await fetch(`${VAPI_BASE_URL}/call/${callId}/transcript`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.transcript || null
  } catch (error) {
    console.error('Error fetching call transcript:', error)
    return null
  }
}

// POST - Fetch and store call history for all user's assistants
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }
    if (!session) {
      return NextResponse.json({ error: 'Please log in first' }, { status: 401 })
    }

    // Get user's assistants
    const { data: userAssistants } = await supabase
      .from('assistants')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)

    if (!userAssistants || userAssistants.length === 0) {
      return NextResponse.json({ 
        message: 'No active assistants found',
        callsProcessed: 0 
      })
    }

    let totalCallsProcessed = 0
    const results = []

    // Process each assistant
    for (const assistant of userAssistants) {
      try {
        console.log(`Fetching calls for assistant: ${assistant.name} (${assistant.vapi_assistant_id})`)
        
        // Fetch calls from Vapi
        const calls = await fetchCallsFromVapi(assistant.vapi_assistant_id, 100)
        
        let assistantCallsProcessed = 0

        // Process each call
        for (const call of calls) {
          try {
            // Fetch transcript if call is ended
            let transcript = null
            if (call.status === 'ended') {
              transcript = await fetchCallTranscript(call.id)
            }

            // Store call in database
            const success = await updateCallHistory(
              session.user.id,
              assistant.id,
              call.id,
              assistant.name,
              call.status,
              call.endedReason,
              call.duration,
              call.cost,
              call.phoneNumber,
              transcript,
              call.metadata,
              call.createdAt
            )

            if (success) {
              assistantCallsProcessed++
              totalCallsProcessed++
            }
          } catch (callError) {
            console.error(`Error processing call ${call.id}:`, callError)
          }
        }

        results.push({
          assistantId: assistant.vapi_assistant_id,
          assistantName: assistant.name,
          callsProcessed: assistantCallsProcessed,
          totalCalls: calls.length
        })

      } catch (assistantError) {
        console.error(`Error processing assistant ${assistant.vapi_assistant_id}:`, assistantError)
        results.push({
          assistantId: assistant.vapi_assistant_id,
          assistantName: assistant.name,
          error: 'Failed to process assistant'
        })
      }
    }

    return NextResponse.json({
      message: 'Call history updated successfully',
      totalCallsProcessed,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in POST /api/call-history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Retrieve call history from database
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }
    if (!session) {
      return NextResponse.json({ error: 'Please log in first' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const assistantId = searchParams.get('assistantId') || undefined
    const status = searchParams.get('status') || undefined

    // Get call history
    const { data: calls, error } = await getCallHistory(
      session.user.id,
      limit,
      offset,
      assistantId,
      status
    )

    if (error) {
      console.error('Error fetching call history:', error)
      return NextResponse.json({ error: 'Failed to fetch call history' }, { status: 500 })
    }

    // Get call history stats
    const stats = await getCallHistoryStats(session.user.id, assistantId)

    return NextResponse.json({
      calls: calls || [],
      stats,
      pagination: {
        limit,
        offset,
        hasMore: (calls || []).length === limit
      }
    })

  } catch (error) {
    console.error('Error in GET /api/call-history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
