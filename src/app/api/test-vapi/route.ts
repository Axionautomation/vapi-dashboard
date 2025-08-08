import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const VAPI_API_KEY = process.env.VAPI_API_KEY
    
    if (!VAPI_API_KEY) {
      return NextResponse.json({ 
        error: 'VAPI_API_KEY not found in environment variables',
        hasKey: false 
      })
    }

    // Test the Vapi API with a simple request
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Vapi API error: ${response.status} ${response.statusText}`,
        status: response.status,
        statusText: response.statusText,
        hasKey: true
      })
    }

    const data = await response.json()
    
    return NextResponse.json({ 
      success: true,
      message: 'Vapi API connection successful',
      assistantsCount: data.assistants?.length || 0,
      hasKey: true
    })
  } catch (error) {
    console.error('Error testing Vapi API:', error)
    return NextResponse.json({ 
      error: 'Failed to connect to Vapi API',
      details: error instanceof Error ? error.message : 'Unknown error',
      hasKey: !!process.env.VAPI_API_KEY
    })
  }
} 