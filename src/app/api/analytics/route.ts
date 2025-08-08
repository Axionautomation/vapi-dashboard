import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const VAPI_BASE_URL = 'https://api.vapi.ai'
const VAPI_API_KEY = process.env.VAPI_API_KEY

if (!VAPI_API_KEY) {
  throw new Error('VAPI_API_KEY environment variable is required')
}

// Fetch calls from Vapi API
async function fetchCallsFromVapi() {
  try {
    const response = await fetch(`${VAPI_BASE_URL}/call`, {
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

// Fetch logs from Vapi API
async function fetchLogsFromVapi() {
  try {
    const response = await fetch(`${VAPI_BASE_URL}/logs?type=Call`, {
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
    return data.logs || []
  } catch (error) {
    console.error('Error fetching logs from Vapi:', error)
    return []
  }
}

// Process calls data into analytics format
function processCallsData(calls: any[]) {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Filter calls from last 7 days
  const recentCalls = calls.filter(call => {
    const callDate = new Date(call.createdAt)
    return callDate >= sevenDaysAgo
  })

  // Group by date
  const callsByDate: { [key: string]: any[] } = {}
  recentCalls.forEach(call => {
    const date = new Date(call.createdAt).toISOString().split('T')[0]
    if (!callsByDate[date]) {
      callsByDate[date] = []
    }
    callsByDate[date].push(call)
  })

  // Calculate metrics
  const totalCalls = recentCalls.length
  const successfulCalls = recentCalls.filter(call => 
    call.status === 'ended' && call.endedReason === 'assistant-ended-call'
  ).length
  const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0

  // Calculate average duration
  const callsWithDuration = recentCalls.filter(call => call.duration)
  const avgDuration = callsWithDuration.length > 0 
    ? callsWithDuration.reduce((sum, call) => sum + call.duration, 0) / callsWithDuration.length 
    : 0

  // Create daily data for charts
  const dailyData = Object.keys(callsByDate).map(date => {
    const dayCalls = callsByDate[date]
    const daySuccessful = dayCalls.filter(call => 
      call.status === 'ended' && call.endedReason === 'assistant-ended-call'
    ).length
    const dayAvgDuration = dayCalls.filter(call => call.duration).length > 0
      ? dayCalls.filter(call => call.duration).reduce((sum, call) => sum + call.duration, 0) / dayCalls.filter(call => call.duration).length
      : 0

    return {
      date,
      calls: dayCalls.length,
      successful: daySuccessful,
      duration: Math.round(dayAvgDuration)
    }
  }).sort((a, b) => a.date.localeCompare(b.date))

  // Calculate call outcomes
  const outcomes = {
    successful: recentCalls.filter(call => 
      call.status === 'ended' && call.endedReason === 'assistant-ended-call'
    ).length,
    failed: recentCalls.filter(call => 
      call.status === 'ended' && call.endedReason === 'assistant-ended-call-failed'
    ).length,
    noAnswer: recentCalls.filter(call => 
      call.status === 'ended' && call.endedReason === 'no-answer'
    ).length,
    busy: recentCalls.filter(call => 
      call.status === 'ended' && call.endedReason === 'busy'
    ).length,
  }

  // Calculate hourly distribution
  const hourlyData = Array.from({ length: 9 }, (_, i) => {
    const hour = i + 9 // 9 AM to 5 PM
    const hourCalls = recentCalls.filter(call => {
      const callHour = new Date(call.createdAt).getHours()
      return callHour === hour
    }).length
    return {
      hour: `${hour} ${hour < 12 ? 'AM' : hour === 12 ? 'PM' : 'PM'}`,
      calls: hourCalls
    }
  })

  return {
    totalCalls,
    successRate: Math.round(successRate * 100) / 100,
    avgDuration: Math.round(avgDuration),
    dailyData,
    outcomes,
    hourlyData
  }
}

// GET - Fetch analytics data
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

    console.log('Fetching analytics for user:', session.user.email)

    // Parse optional assistant filter from query string (comma-separated list)
    const { searchParams } = new URL(request.url)
    const assistantIdsParam = searchParams.get('assistantIds') // e.g. id1,id2,id3

    // Fetch data from Vapi once and cache locally
    const [calls, logs] = await Promise.all([
      fetchCallsFromVapi(),
      fetchLogsFromVapi()
    ])

    // Get user's assistants for performance metrics / filtering
    const { data: userAssistants } = await supabase
      .from('assistants')
      .select('*')
      .eq('user_id', session.user.id)

    // Determine the set of assistantIds we should keep
    const userAssistantIds = (userAssistants || []).map(a => a.vapi_assistant_id)
    let effectiveAssistantIds = userAssistantIds

    if (assistantIdsParam) {
      const requestedIds = assistantIdsParam.split(',').map(id => id.trim()).filter(Boolean)
      // Only keep ids that belong to this user to prevent leaking data across users
      effectiveAssistantIds = requestedIds.filter(id => userAssistantIds.includes(id))
    }

    // Filter calls to only those assistants
    const filteredCalls = calls.filter((call: any) => effectiveAssistantIds.includes(call.assistantId))

    // Process the data
    const analytics = processCallsData(filteredCalls)

    // Calculate assistant performance for *filtered* assistants only
    const assistantPerformance = (userAssistants || [])
      .filter(assistant => effectiveAssistantIds.includes(assistant.vapi_assistant_id))
      .map(assistant => {
        const assistantCalls = filteredCalls.filter((call: any) => call.assistantId === assistant.vapi_assistant_id)
        const assistantSuccessful = assistantCalls.filter((call: any) => 
          call.status === 'ended' && call.endedReason === 'assistant-ended-call'
        ).length
        const assistantSuccessRate = assistantCalls.length > 0 ? (assistantSuccessful / assistantCalls.length) * 100 : 0
        const assistantAvgDuration = assistantCalls.filter((call: any) => call.duration).length > 0
          ? assistantCalls.filter((call: any) => call.duration).reduce((sum: number, call: any) => sum + (call.duration || 0), 0) / assistantCalls.filter((call: any) => call.duration).length / 60
          : 0

        return {
          name: assistant.name,
          calls: assistantCalls.length,
          successRate: Math.round(assistantSuccessRate * 100) / 100,
          avgDuration: Math.round(assistantAvgDuration * 100) / 100
        }
      })

    return NextResponse.json({
      analytics,
      assistantPerformance,
      totalAssistants: userAssistants?.length || 0,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in GET /api/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 

// Simple in-memory cache for POST analytics queries
const analyticsCache = new Map<string, { timestamp: number; payload: any }>()
const ANALYTICS_CACHE_TTL_MS = 60_000

async function queryVapiAnalytics(query: any) {
  const resp = await fetch(`${VAPI_BASE_URL}/analytics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Vapi analytics error ${resp.status}: ${text || resp.statusText}`)
  }
  return resp.json()
}

// POST - Proxy advanced analytics query to Vapi and return normalized dashboard data
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

    // Read query body (basic date-range support)
    const body = await request.json().catch(() => ({})) as {
      startDate?: string
      endDate?: string
      groupBy?: string
      assistantIds?: string[]
    }

    const cacheKey = JSON.stringify(body || {})
    const now = Date.now()
    const cached = analyticsCache.get(cacheKey)
    if (cached && now - cached.timestamp < ANALYTICS_CACHE_TTL_MS) {
      return NextResponse.json({ ...cached.payload, cached: true })
    }

    // Gather assistant IDs (from body or user's assistants)
    const { data: userAssistants } = await supabase
      .from('assistants')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)

    const assistantIds = Array.isArray(body.assistantIds) && body.assistantIds.length > 0
      ? body.assistantIds
      : (userAssistants || []).map(a => a.vapi_assistant_id).filter(Boolean)

    console.log(`Fetching analytics for ${assistantIds.length} assistants:`, assistantIds)

    // 1) Call Vapi Analytics endpoint with multiple variants
    // Build proper AnalyticsQuery objects for different groupings
    const baseQuery = {
      ...(body.startDate && { startDate: body.startDate }),
      ...(body.endDate && { endDate: body.endDate }),
      ...(assistantIds.length > 0 && { assistantIds }),
    }

    let vapiDaily: any = null
    let vapiOutcomes: any = null
    let vapiHourly: any = null
    let vapiPerAssistant: any = null

    try {
      console.log('Making 4 parallel requests to Vapi analytics...')
      const queries = await Promise.allSettled([
        queryVapiAnalytics({ ...baseQuery, groupBy: ['createdAt'] }),
        queryVapiAnalytics({ ...baseQuery, groupBy: ['endedReason'] }),
        queryVapiAnalytics({ ...baseQuery, groupBy: ['hour'] }),
        queryVapiAnalytics({ ...baseQuery, groupBy: ['assistantId'] }),
      ])

      vapiDaily = queries[0].status === 'fulfilled' ? queries[0].value : null
      vapiOutcomes = queries[1].status === 'fulfilled' ? queries[1].value : null
      vapiHourly = queries[2].status === 'fulfilled' ? queries[2].value : null
      vapiPerAssistant = queries[3].status === 'fulfilled' ? queries[3].value : null

      // Log any failures
      queries.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Vapi query ${index} failed:`, result.reason)
        }
      })
    } catch (e) {
      console.error('Error querying Vapi analytics:', e)
    }

    // Fallback: compute from recent calls if needed
    const [calls] = await Promise.all([ fetchCallsFromVapi() ])
    const fallbackAnalytics = processCallsData(calls)

    // Normalize Vapi analytics responses into dashboard shape
    function normalizeDaily(input: any): Array<{ date: string; calls: number; successful: number; duration: number }> {
      const rows = input?.rows || input?.data || []
      if (!Array.isArray(rows) || rows.length === 0) return fallbackAnalytics.dailyData
      return rows.map((r: any) => {
        const date = r.date || r.day || r.createdDate || r.bucket || ''
        const calls = r.count ?? r.totalCalls ?? r.calls ?? 0
        const successful = r.successful ?? r.successfulCalls ?? 0
        const durationRaw = r.avgDuration ?? r.averageDuration ?? r.minutesUsed ?? r.duration ?? 0
        const duration = Math.round(Number(durationRaw) || 0)
        return { date, calls: Number(calls) || 0, successful: Number(successful) || 0, duration }
      })
      .filter(d => d.date)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    }

    function normalizeOutcomes(input: any): { successful: number; failed: number; noAnswer: number; busy: number } {
      const rows = input?.rows || input?.data || []
      if (!Array.isArray(rows) || rows.length === 0) return fallbackAnalytics.outcomes
      const sumByReason: Record<string, number> = {}
      for (const r of rows) {
        const reason = (r.endedReason || r.reason || '').toString()
        const count = r.count ?? r.totalCalls ?? r.calls ?? 0
        if (!reason) continue
        sumByReason[reason] = (sumByReason[reason] || 0) + Number(count)
      }
      // Map into our buckets
      const successful = (sumByReason['assistant-ended-call'] || 0) + (sumByReason['call.ringing.hook-executed-say'] || 0) + (sumByReason['call.ringing.hook-executed-transfer'] || 0)
      const noAnswer = sumByReason['no-answer'] || 0
      const busy = sumByReason['busy'] || 0
      const failed = Object.keys(sumByReason)
        .filter(k => !['assistant-ended-call','call.ringing.hook-executed-say','call.ringing.hook-executed-transfer','no-answer','busy'].includes(k))
        .reduce((acc, k) => acc + (sumByReason[k] || 0), 0)
      return { successful, failed, noAnswer, busy }
    }

    function normalizeHourly(input: any): Array<{ hour: string; calls: number }> {
      const rows = input?.rows || input?.data || []
      if (!Array.isArray(rows) || rows.length === 0) return fallbackAnalytics.hourlyData
      return rows.map((r: any) => {
        const hour = r.hour ?? r.createdHour ?? r.bucket ?? ''
        const calls = r.count ?? r.totalCalls ?? r.calls ?? 0
        // Ensure display like `9AM`, `10AM`, etc. if numeric
        let hourLabel = String(hour)
        const hourNum = Number(hour)
        if (!isNaN(hourNum)) {
          const h = hourNum
          hourLabel = h === 0 ? '12AM' : h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`
        }
        return { hour: hourLabel, calls: Number(calls) || 0 }
      })
    }

    function normalizeAssistantPerformance(input: any): Array<{ name: string; calls: number; successRate: number; avgDuration: number }> {
      const rows = input?.rows || input?.data || []
      if (!Array.isArray(rows) || rows.length === 0) {
        // Fallback from calls (may be sparse)
        return (userAssistants || []).map(assistant => {
          const assistantCalls = (calls || []).filter((call: any) => call.assistantId === assistant.vapi_assistant_id)
          const assistantSuccessful = assistantCalls.filter((call: any) =>
            call.status === 'ended' && call.endedReason === 'assistant-ended-call'
          ).length
          const assistantSuccessRate = assistantCalls.length > 0 ? (assistantSuccessful / assistantCalls.length) * 100 : 0
          const assistantAvgDuration = assistantCalls.filter((call: any) => call.duration).length > 0
            ? assistantCalls.filter((call: any) => call.duration).reduce((sum: number, call: any) => sum + (call.duration || 0), 0) / assistantCalls.filter((call: any) => call.duration).length / 60
            : 0
          return {
            name: assistant.name,
            calls: assistantCalls.length,
            successRate: Math.round(assistantSuccessRate * 100) / 100,
            avgDuration: Math.round(assistantAvgDuration * 100) / 100
          }
        })
      }
      // Aggregate by assistantId and endedReason if present
      const byAssistant: Record<string, { calls: number; successful: number; durationSum: number; durationCount: number }> = {}
      for (const r of rows) {
        const id = r.assistantId || r.assistant_id || r.assistant || ''
        if (!id) continue
        const count = r.count ?? r.totalCalls ?? r.calls ?? 0
        const reason = (r.endedReason || r.reason || '').toString()
        const avgDur = r.avgDuration ?? r.averageDuration ?? r.minutesUsed ?? r.duration ?? 0
        const rec = byAssistant[id] || { calls: 0, successful: 0, durationSum: 0, durationCount: 0 }
        rec.calls += Number(count) || 0
        if (['assistant-ended-call','call.ringing.hook-executed-say','call.ringing.hook-executed-transfer'].includes(reason)) {
          rec.successful += Number(count) || 0
        }
        if (avgDur) {
          rec.durationSum += Number(avgDur) || 0
          rec.durationCount += 1
        }
        byAssistant[id] = rec
      }
      return (userAssistants || []).map(assistant => {
        const id = assistant.vapi_assistant_id
        const rec = byAssistant[id] || { calls: 0, successful: 0, durationSum: 0, durationCount: 0 }
        const successRate = rec.calls > 0 ? (rec.successful / rec.calls) * 100 : 0
        const avgDuration = rec.durationCount > 0 ? rec.durationSum / rec.durationCount : 0
        return {
          name: assistant.name,
          calls: rec.calls,
          successRate: Math.round(successRate * 100) / 100,
          avgDuration: Math.round(avgDuration * 100) / 100,
        }
      })
    }

    const dailyData = normalizeDaily(vapiDaily)
    const outcomes = normalizeOutcomes(vapiOutcomes)
    const hourlyData = normalizeHourly(vapiHourly)
    const assistantPerformance = normalizeAssistantPerformance(vapiPerAssistant)

    const totalCalls = dailyData.reduce((acc, d) => acc + (d.calls || 0), 0)
    const successRate = totalCalls > 0 ? (dailyData.reduce((acc, d) => acc + (d.successful || 0), 0) / totalCalls) * 100 : 0
    const avgDuration = dailyData.length > 0 ? Math.round(dailyData.reduce((acc, d) => acc + (d.duration || 0), 0) / dailyData.length) : 0
    const analytics = { totalCalls, successRate: Math.round(successRate * 100) / 100, avgDuration, dailyData, outcomes, hourlyData }

    const payload = {
      analytics,
      assistantPerformance,
      totalAssistants: userAssistants?.length || 0,
      lastUpdated: new Date().toISOString(),
      vapiAnalytics: { daily: vapiDaily, outcomes: vapiOutcomes, hourly: vapiHourly, perAssistant: vapiPerAssistant },
    }

    analyticsCache.set(cacheKey, { timestamp: now, payload })
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}