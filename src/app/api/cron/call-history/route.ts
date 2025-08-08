import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { updateCallHistory } from '@/lib/database'

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

// POST - Cron job to fetch and store call history for all users
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all users with active assistants
    const { data: allAssistants, error: assistantsError } = await supabase
      .from('assistants')
      .select(`
        *,
        user_id,
        users!inner(email)
      `)
      .eq('is_active', true)

    if (assistantsError) {
      console.error('Error fetching assistants:', assistantsError)
      return NextResponse.json({ error: 'Failed to fetch assistants' }, { status: 500 })
    }

    if (!allAssistants || allAssistants.length === 0) {
      return NextResponse.json({ 
        message: 'No active assistants found',
        callsProcessed: 0 
      })
    }

    // Group assistants by user
    const assistantsByUser = allAssistants.reduce((acc, assistant) => {
      if (!acc[assistant.user_id]) {
        acc[assistant.user_id] = []
      }
      acc[assistant.user_id].push(assistant)
      return acc
    }, {} as Record<string, typeof allAssistants>)

    let totalCallsProcessed = 0
    const results = []

    // Process each user's assistants
    for (const [userId, userAssistants] of Object.entries(assistantsByUser)) {
      const userResults = {
        userId,
        userEmail: userAssistants[0]?.users?.email || 'Unknown',
        assistants: [] as any[]
      }

      // Process each assistant for this user
      for (const assistant of userAssistants) {
        try {
          console.log(`[CRON] Fetching calls for assistant: ${assistant.name} (${assistant.vapi_assistant_id})`)
          
          // Fetch calls from Vapi (last 7 days since we run daily)
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          const calls = await fetchCallsFromVapi(assistant.vapi_assistant_id, 500, sevenDaysAgo)
          
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
                userId,
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
              console.error(`[CRON] Error processing call ${call.id}:`, callError)
            }
          }

          userResults.assistants.push({
            assistantId: assistant.vapi_assistant_id,
            assistantName: assistant.name,
            callsProcessed: assistantCallsProcessed,
            totalCalls: calls.length
          })

        } catch (assistantError) {
          console.error(`[CRON] Error processing assistant ${assistant.vapi_assistant_id}:`, assistantError)
          userResults.assistants.push({
            assistantId: assistant.vapi_assistant_id,
            assistantName: assistant.name,
            error: 'Failed to process assistant'
          })
        }
      }

      results.push(userResults)
    }

    console.log(`[CRON] Call history update completed: ${totalCallsProcessed} calls processed for ${results.length} users`)

    return NextResponse.json({
      message: 'Call history cron job completed successfully',
      totalCallsProcessed,
      usersProcessed: results.length,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[CRON] Error in call history cron job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Health check endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Call history cron endpoint is running',
    timestamp: new Date().toISOString()
  })
}
