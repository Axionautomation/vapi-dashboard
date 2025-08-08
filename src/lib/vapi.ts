// Vapi API integration
const VAPI_BASE_URL = 'https://api.vapi.ai'
const VAPI_API_KEY = process.env.VAPI_API_KEY

if (!VAPI_API_KEY) {
  console.warn('VAPI_API_KEY environment variable is not set. Vapi features will be disabled.')
}

export interface VapiAssistant {
  id: string
  name: string
  firstMessage?: string
  model?: {
    provider: string
    model: string
    toolIds?: string[]
    messages?: Array<{
      role: string
      content: string
    }>
    temperature?: number
    knowledgeBase?: {
      fileIds: string[]
      provider: string
    }
  }
  voice?: {
    provider: string
    voiceId: string // Note: API returns voiceId, not voice_id
    model?: string
    stability?: number
    similarityBoost?: number
  }
  transcriber?: {
    model: string
    language: string
    provider: string
    confidenceThreshold?: number
  }
  metadata?: any
  createdAt?: string
  updatedAt?: string
  orgId?: string
  voicemailMessage?: string
  endCallMessage?: string
  isServerUrlSecretSet?: boolean
}

export interface VapiError {
  error: string
  message?: string
}

export async function fetchAssistantFromVapi(assistantId: string): Promise<VapiAssistant | null> {
  if (!VAPI_API_KEY) {
    console.warn('VAPI_API_KEY is not set, cannot fetch assistant')
    return null
  }

  try {
    console.log('Fetching assistant from Vapi:', assistantId)
    
    const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Vapi API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return null
    }

    const assistant = await response.json()
    console.log('Vapi assistant fetched:', assistant.name)
    return assistant
  } catch (error) {
    console.error('Error fetching assistant from Vapi:', error)
    return null
  }
}

export async function listAssistantsFromVapi(): Promise<VapiAssistant[]> {
  if (!VAPI_API_KEY) {
    console.warn('VAPI_API_KEY is not set, cannot list assistants')
    return []
  }

  try {
    const response = await fetch(`${VAPI_BASE_URL}/assistant`, {
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
    return data.assistants || []
  } catch (error) {
    console.error('Error fetching assistants from Vapi:', error)
    return []
  }
}

// Create a new assistant in Vapi
export async function createAssistantInVapi(assistantData: {
  name: string
  firstMessage?: string
  model?: {
    provider: string
    model: string
    messages?: Array<{
      role: string
      content: string
    }>
  }
  voice?: {
    provider: string
    voice_id: string
  }
  metadata?: any
}): Promise<VapiAssistant | null> {
  if (!VAPI_API_KEY) {
    console.error('VAPI_API_KEY is not set')
    return null
  }

  try {
    const response = await fetch(`${VAPI_BASE_URL}/assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assistantData),
    })

    if (!response.ok) {
      const errorData: VapiError = await response.json()
      console.error('Vapi API error:', errorData)
      return null
    }

    const assistant: VapiAssistant = await response.json()
    return assistant
  } catch (error) {
    console.error('Error creating assistant in Vapi:', error)
    return null
  }
} 