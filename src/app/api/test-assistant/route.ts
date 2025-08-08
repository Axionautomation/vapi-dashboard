import { NextRequest, NextResponse } from 'next/server'
import { fetchAssistantFromVapi } from '@/lib/vapi'

export async function POST(request: NextRequest) {
  try {
    const { assistantId } = await request.json()

    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 })
    }

    console.log('Testing Vapi assistant fetch for ID:', assistantId)
    
    // Fetch assistant details from Vapi
    const vapiAssistant = await fetchAssistantFromVapi(assistantId)
    
    if (!vapiAssistant) {
      return NextResponse.json({ 
        error: 'Assistant not found in Vapi or API error occurred',
        assistantId 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      assistant: {
        id: vapiAssistant.id,
        name: vapiAssistant.name,
        firstMessage: vapiAssistant.firstMessage,
        model: vapiAssistant.model?.model,
        voice: vapiAssistant.voice?.voiceId,
        provider: vapiAssistant.model?.provider,
        voiceProvider: vapiAssistant.voice?.provider,
        createdAt: vapiAssistant.createdAt,
        updatedAt: vapiAssistant.updatedAt,
      }
    })
  } catch (error) {
    console.error('Error testing assistant fetch:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 