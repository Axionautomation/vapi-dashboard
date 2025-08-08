import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { fetchAssistantFromVapi, VapiAssistant } from '@/lib/vapi'

// GET - Fetch all user's assistants with Vapi details
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }

    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Please log in first' }, { status: 401 })
    }

    console.log('Fetching assistants for user:', session.user.email)

    // Get all assistants for the user
    const { data: assistants, error: fetchError } = await supabase
      .from('assistants')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching assistants:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch assistants' }, { status: 500 })
    }

    // Enrich assistants with Vapi data
    const enrichedAssistants = await Promise.all(
      (assistants || []).map(async (assistant) => {
        try {
          const vapiAssistant = await fetchAssistantFromVapi(assistant.vapi_assistant_id)
          return {
            ...assistant,
            vapi_details: vapiAssistant,
            has_vapi_data: !!vapiAssistant
          }
        } catch (error) {
          console.error(`Error fetching Vapi details for assistant ${assistant.vapi_assistant_id}:`, error)
          return {
            ...assistant,
            vapi_details: null,
            has_vapi_data: false
          }
        }
      })
    )

    return NextResponse.json({ assistants: enrichedAssistants })
  } catch (error) {
    console.error('Error in GET /api/assistants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a new assistant with Vapi validation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }

    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Please log in first' }, { status: 401 })
    }

    console.log('Adding assistant for user:', session.user.email)

    const { assistantId, name, description } = await request.json()

    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 })
    }

    // First, validate the assistant exists in Vapi
    console.log('Validating assistant with Vapi:', assistantId)
    const vapiAssistant = await fetchAssistantFromVapi(assistantId)
    
    if (!vapiAssistant) {
      return NextResponse.json({ 
        error: 'Assistant not found in Vapi. Please check the Assistant ID and try again.' 
      }, { status: 404 })
    }

    console.log('Vapi assistant found:', vapiAssistant.name)

    // Check if assistant already exists for this user
    const { data: existingAssistant } = await supabase
      .from('assistants')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('vapi_assistant_id', assistantId)
      .single()

    if (existingAssistant) {
      return NextResponse.json({ error: 'Assistant already exists' }, { status: 409 })
    }

    // Insert new assistant with Vapi details
    const { data: assistant, error: insertError } = await supabase
      .from('assistants')
      .insert({
        user_id: session.user.id,
        vapi_assistant_id: assistantId,
        name: name || vapiAssistant.name || `Assistant ${assistantId}`,
        description: description || vapiAssistant.firstMessage || null,
        model: vapiAssistant.model?.model || null,
        voice: vapiAssistant.voice?.voiceId || null,
        first_message: vapiAssistant.firstMessage || null,
        metadata: vapiAssistant.metadata || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting assistant:', insertError)
      return NextResponse.json({ error: 'Failed to add assistant' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      assistant: {
        ...assistant,
        vapi_details: vapiAssistant
      },
      message: 'Assistant added successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/assistants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 