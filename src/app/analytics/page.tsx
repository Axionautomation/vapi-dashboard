'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Layout } from '@/components/layout'
import { Loader2, BarChart3, Phone, TrendingUp, Clock, Users, Calendar, RefreshCw, Download } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

interface AnalyticsData {
  totalCalls: number
  successRate: number
  avgDuration: number
  dailyData: Array<{
    date: string
    calls: number
    successful: number
    duration: number
  }>
  outcomes: {
    successful: number
    failed: number
    noAnswer: number
    busy: number
  }
  hourlyData: Array<{
    hour: string
    calls: number
  }>
}

interface AssistantPerformance {
  name: string
  calls: number
  successRate: number
  avgDuration: number
}

export default function AnalyticsPage() {
  const { user, loading } = useAuth()
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [assistantPerformance, setAssistantPerformance] = useState<AssistantPerformance[]>([])
  const [totalAssistants, setTotalAssistants] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [dateRange, setDateRange] = useState<string>('lastWeek')
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Convert date range selection to actual dates
  const getDateRange = (range: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (range) {
      case 'lastWeek':
        const lastWeek = new Date(today)
        lastWeek.setDate(today.getDate() - 7)
        return { startDate: lastWeek.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] }
      case 'lastMonth':
        const lastMonth = new Date(today)
        lastMonth.setMonth(today.getMonth() - 1)
        return { startDate: lastMonth.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] }
      case 'lastYear':
        const lastYear = new Date(today)
        lastYear.setFullYear(today.getFullYear() - 1)
        return { startDate: lastYear.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] }
      case 'last30Days':
        const last30Days = new Date(today)
        last30Days.setDate(today.getDate() - 30)
        return { startDate: last30Days.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] }
      case 'last90Days':
        const last90Days = new Date(today)
        last90Days.setDate(today.getDate() - 90)
        return { startDate: last90Days.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] }
      default:
        return { startDate: '', endDate: '' }
    }
  }

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      setError('')
      
      const response = await fetch('/api/analytics')
      const data = await response.json()
      
      if (response.ok) {
        setAnalyticsData(data.analytics)
        setAssistantPerformance(data.assistantPerformance)
        setTotalAssistants(data.totalAssistants)
        setLastUpdated(data.lastUpdated)
      } else {
        setError(data.error || 'Failed to fetch analytics')
      }
    } catch (error) {
      setError('Failed to fetch analytics data')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const refreshAll = async () => {
    try {
      setIsRefreshing(true)
      setError('')

      const { startDate, endDate } = getDateRange(dateRange)

      // 1) POST to analytics to get fresh computed/Vapi analytics (with date range)
      const postRes = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          startDate, 
          endDate,
          // Include all user's assistants by default
          assistantIds: []
        })
      })
      const postData = await postRes.json()
      if (postRes.ok) {
        setAnalyticsData(postData.analytics)
        setAssistantPerformance(postData.assistantPerformance)
        setTotalAssistants(postData.totalAssistants)
        setLastUpdated(postData.lastUpdated)
      } else {
        setError(postData.error || 'Failed to refresh analytics')
      }

      // 2) Also refresh assistants list indirectly by hitting GET /api/assistants (no UI state here; endpoint is warmed)
      await fetch('/api/assistants')
    } catch (err) {
      setError('Failed to refresh data')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh when date range changes
  useEffect(() => {
    if (user) {
      refreshAll()
    }
  }, [dateRange, user])

  const exportCSV = () => {
    if (!analyticsData) return
    const rows = [
      ['date', 'calls', 'successful', 'duration'],
      ...analyticsData.dailyData.map(d => [d.date, String(d.calls), String(d.successful), String(d.duration)])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'analytics.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user])

  if (loading || analyticsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading analytics...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!user) {
    return null
  }

  // Use real data when available, fallback to minimal empty state
  const safeData: AnalyticsData = analyticsData || {
    totalCalls: 0,
    successRate: 0,
    avgDuration: 0,
    dailyData: [],
    outcomes: { successful: 0, failed: 0, noAnswer: 0, busy: 0 },
    hourlyData: []
  }

  const mockAssistantPerformance: AssistantPerformance[] = [
    { name: 'Appointment Scheduler', calls: 456, successRate: 82.3, avgDuration: 3.1 },
    { name: 'Customer Support', calls: 389, successRate: 75.8, avgDuration: 4.2 },
    { name: 'Sales Assistant', calls: 402, successRate: 79.1, avgDuration: 2.8 }
  ]

  const COLORS = ['#6514a3', '#8b5cf6', '#a855f7', '#c084fc']

  return (
    <Layout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Analytics Overview
              </h2>
              <p className="text-muted-foreground">
                Detailed insights into your voice assistant performance and call analytics.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border rounded px-3 py-2 text-sm bg-background"
              >
                <option value="lastWeek">Last Week</option>
                <option value="last30Days">Last 30 Days</option>
                <option value="lastMonth">Last Month</option>
                <option value="last90Days">Last 90 Days</option>
                <option value="lastYear">Last Year</option>
              </select>
              <Button onClick={refreshAll} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>

        {error && (
          <Card className="mb-6 border-destructive/20 bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeData.totalCalls}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeData.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeData.avgDuration}m</div>
              <p className="text-xs text-muted-foreground">
                -2% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Assistants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssistants}</div>
              <p className="text-xs text-muted-foreground">
                +1 this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Call Volume */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Call Volume</CardTitle>
              <CardDescription>
                Calls per day over the last week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safeData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                   <Bar dataKey="calls" fill="#6514a3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Call Outcomes */}
          <Card>
            <CardHeader>
              <CardTitle>Call Outcomes</CardTitle>
              <CardDescription>
                Distribution of call results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                   <Pie
                     data={[
                       { name: 'Successful', value: safeData.outcomes.successful },
                       { name: 'Failed', value: safeData.outcomes.failed },
                       { name: 'No Answer', value: safeData.outcomes.noAnswer },
                       { name: 'Busy', value: safeData.outcomes.busy }
                     ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Chart Type: Area Trend */}
        <div className="grid grid-cols-1 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Call Duration Trend</CardTitle>
              <CardDescription>
                Average duration trend over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={safeData.dailyData}>
                  <defs>
                    <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6514a3" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#6514a3" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="duration" stroke="#6514a3" fillOpacity={1} fill="url(#colorDuration)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Assistant Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Assistant Performance</CardTitle>
            <CardDescription>
              Performance metrics by assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assistantPerformance.map((assistant, index) => (
                <div key={assistant.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <div>
                      <h3 className="font-medium">{assistant.name}</h3>
                      <p className="text-sm text-muted-foreground">{assistant.calls} calls</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{assistant.successRate}% success</p>
                    <p className="text-sm text-muted-foreground">{assistant.avgDuration}m avg</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
} 