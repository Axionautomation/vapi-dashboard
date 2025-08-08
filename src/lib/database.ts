import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://riyfvqwymwvfdlzjmplt.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseKey || 'dummy-key')

// Database types
export interface Assistant {
  id: string
  user_id: string
  vapi_assistant_id: string
  name: string
  description?: string
  model?: string
  voice?: string
  first_message?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export interface CreateAssistantData {
  vapi_assistant_id: string
  name: string
  description?: string
  model?: string
  voice?: string
  first_message?: string
  metadata?: any
}

// Database operations
export async function createAssistant(userId: string, data: CreateAssistantData): Promise<Assistant | null> {
  const { data: assistant, error } = await supabase
    .from('assistants')
    .insert({
      user_id: userId,
      ...data,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating assistant:', error)
    return null
  }

  return assistant
}

export async function getAssistantByVapiId(userId: string, vapiAssistantId: string): Promise<Assistant | null> {
  const { data: assistant, error } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('vapi_assistant_id', vapiAssistantId)
    .single()

  if (error) {
    console.error('Error fetching assistant:', error)
    return null
  }

  return assistant
}

export async function getAssistantByName(userId: string, name: string): Promise<Assistant | null> {
  const { data: assistant, error } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('name', name)
    .single()

  if (error) {
    console.error('Error fetching assistant by name:', error)
    return null
  }

  return assistant
}

export async function getAllAssistants(userId: string): Promise<Assistant[]> {
  const { data: assistants, error } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching assistants:', error)
    return []
  }

  return assistants || []
}

export async function updateAssistant(userId: string, vapiAssistantId: string, data: Partial<CreateAssistantData>): Promise<Assistant | null> {
  const { data: assistant, error } = await supabase
    .from('assistants')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('vapi_assistant_id', vapiAssistantId)
    .select()
    .single()

  if (error) {
    console.error('Error updating assistant:', error)
    return null
  }

  return assistant
}

export async function deleteAssistant(userId: string, vapiAssistantId: string): Promise<boolean> {
  const { error } = await supabase
    .from('assistants')
    .delete()
    .eq('user_id', userId)
    .eq('vapi_assistant_id', vapiAssistantId)

  if (error) {
    console.error('Error deleting assistant:', error)
    return false
  }

  return true
}

// Analytics-related functions
export async function updateAssistantAnalytics(
  userId: string, 
  vapiAssistantId: string, 
  analytics: {
    totalCalls: number
    successfulCalls: number
    failedCalls: number
    avgDurationSeconds: number
  }
): Promise<boolean> {
  const { error } = await supabase.rpc('update_assistant_analytics', {
    p_user_id: userId,
    p_vapi_assistant_id: vapiAssistantId,
    p_total_calls: analytics.totalCalls,
    p_successful_calls: analytics.successfulCalls,
    p_failed_calls: analytics.failedCalls,
    p_avg_duration_seconds: analytics.avgDurationSeconds
  })

  if (error) {
    console.error('Error updating assistant analytics:', error)
    return false
  }

  return true
}

export async function cacheAnalyticsData(
  userId: string,
  assistantId: string | null,
  dateRange: string,
  startDate: string,
  endDate: string,
  data: any
): Promise<boolean> {
  const { error } = await supabase
    .from('analytics_cache')
    .upsert({
      user_id: userId,
      assistant_id: assistantId,
      date_range: dateRange,
      start_date: startDate,
      end_date: endDate,
      cache_data: data,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
    })

  if (error) {
    console.error('Error caching analytics data:', error)
    return false
  }

  return true
}

export async function getCachedAnalyticsData(
  userId: string,
  assistantId: string | null,
  dateRange: string,
  startDate: string,
  endDate: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from('analytics_cache')
    .select('cache_data')
    .eq('user_id', userId)
    .eq('assistant_id', assistantId)
    .eq('date_range', dateRange)
    .eq('start_date', startDate)
    .eq('end_date', endDate)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return null
  }

  return data.cache_data
}

// Call History Functions
export async function updateCallHistory(
  userId: string,
  assistantId: string,
  vapiCallId: string,
  assistantName: string,
  status: string,
  endedReason?: string,
  duration?: number,
  cost?: number,
  phoneNumber?: string,
  transcript?: string,
  metadata?: any,
  createdAt?: string
): Promise<boolean> {
  const { error } = await supabase.rpc('update_call_history', {
    p_user_id: userId,
    p_assistant_id: assistantId,
    p_vapi_call_id: vapiCallId,
    p_assistant_name: assistantName,
    p_status: status,
    p_ended_reason: endedReason,
    p_duration: duration,
    p_cost: cost,
    p_phone_number: phoneNumber,
    p_transcript: transcript,
    p_metadata: metadata,
    p_created_at: createdAt || new Date().toISOString()
  })
  if (error) { 
    console.error('Error updating call history:', error)
    return false 
  }
  return true
}

export async function getCallHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0,
  assistantId?: string,
  status?: string
): Promise<{ data: any[] | null; error: any }> {
  let query = supabase
    .from('call_history')
    .select(`
      *,
      assistants (
        name,
        description,
        model,
        voice
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (assistantId) {
    query = query.eq('assistant_id', assistantId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  return query
}

export async function getCallHistoryStats(
  userId: string,
  assistantId?: string
): Promise<{ totalCalls: number; totalDuration: number; totalCost: number; successRate: number }> {
  let query = supabase
    .from('call_history')
    .select('status, duration, cost, ended_reason')
    .eq('user_id', userId)

  if (assistantId) {
    query = query.eq('assistant_id', assistantId)
  }

  const { data, error } = await query

  if (error || !data) {
    return { totalCalls: 0, totalDuration: 0, totalCost: 0, successRate: 0 }
  }

  const totalCalls = data.length
  const totalDuration = data.reduce((sum, call) => sum + (call.duration || 0), 0)
  const totalCost = data.reduce((sum, call) => sum + (call.cost || 0), 0)
  const successfulCalls = data.filter(call => 
    call.status === 'ended' && call.ended_reason === 'assistant-ended-call'
  ).length
  const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0

  return { totalCalls, totalDuration, totalCost, successRate }
} 