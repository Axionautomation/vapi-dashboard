import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { fetchAssistantFromVapi } from '@/lib/vapi'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assistantId } = await params

    // Fetch assistant details from Vapi
    const vapiAssistant = await fetchAssistantFromVapi(assistantId)
    
    if (!vapiAssistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 })
    }

    return NextResponse.json({ assistant: vapiAssistant })
  } catch (error) {
    console.error('Error fetching assistant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assistantId } = await params
    const updateData = await request.json()

    // Validate required fields
    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 })
    }

    // Clean up the update data - remove id and ensure maxDurationSeconds is valid
    const cleanUpdateData = { ...updateData }
    delete cleanUpdateData.id // Remove id as it shouldn't be sent to Vapi
    
    // Ensure maxDurationSeconds is at least 10 if provided
    if (cleanUpdateData.maxDurationSeconds !== undefined && cleanUpdateData.maxDurationSeconds < 10) {
      cleanUpdateData.maxDurationSeconds = 10
    }

    // Make PATCH request to Vapi API
    const VAPI_API_KEY = process.env.VAPI_API_KEY
    if (!VAPI_API_KEY) {
      return NextResponse.json({ error: 'VAPI_API_KEY not configured' }, { status: 500 })
    }

    const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanUpdateData),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Vapi API error:', errorData)
      return NextResponse.json(
        { error: `Failed to update assistant: ${response.statusText}` },
        { status: response.status }
      )
    }

    // Fetch the updated assistant data from Vapi to ensure we have the latest
    const updatedAssistant = await fetchAssistantFromVapi(assistantId)
    
    if (!updatedAssistant) {
      return NextResponse.json({ error: 'Failed to fetch updated assistant data' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      assistant: updatedAssistant,
      message: 'Assistant updated successfully' 
    })
  } catch (error) {
    console.error('Error updating assistant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assistantId } = await params

    // Delete from local database
    const { error: deleteError } = await supabase
      .from('assistants')
      .delete()
      .eq('vapi_assistant_id', assistantId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting assistant:', deleteError)
      return NextResponse.json({ error: 'Failed to delete assistant' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Assistant deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting assistant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 