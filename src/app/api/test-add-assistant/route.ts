import { NextRequest, NextResponse } from 'next/server'
import { fetchAssistantFromVapi } from '@/lib/vapi'

// Test endpoint - bypasses authentication to test Vapi integration
export async function POST(request: NextRequest) {
  try {
    const { assistantId, name } = await request.json()

    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 })
    }

    console.log('Testing Vapi fetch for assistant:', assistantId)

    // Fetch assistant from Vapi using GET request (like your curl command)
    const vapiAssistant = await fetchAssistantFromVapi(assistantId)
    
    if (!vapiAssistant) {
      return NextResponse.json({ error: 'Assistant not found in Vapi' }, { status: 404 })
    }

    console.log('Successfully fetched assistant:', vapiAssistant.name)

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
        metadata: vapiAssistant.metadata,
      },
      message: 'Assistant fetched successfully (test endpoint)'
    })
  } catch (error) {
    console.error('Error testing assistant fetch:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 