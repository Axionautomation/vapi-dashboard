'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Phone, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  RefreshCw, 
  Download,
  Search,
  Filter,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react'

interface CallHistory {
  id: string
  vapi_call_id: string
  assistant_name: string
  status: string
  ended_reason?: string
  duration?: number
  cost?: number
  phone_number?: string
  transcript?: string
  created_at: string
  assistants?: {
    name: string
    description?: string
    model?: string
    voice?: string
  }
}

interface CallStats {
  totalCalls: number
  totalDuration: number
  totalCost: number
  successRate: number
}

export default function CallHistoryPage() {
  const { user } = useAuth()
  const [calls, setCalls] = useState<CallHistory[]>([])
  const [stats, setStats] = useState<CallStats>({ totalCalls: 0, totalDuration: 0, totalCost: 0, successRate: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [assistants, setAssistants] = useState<Array<{ id: string; name: string }>>([])
  
  // Filters
  const [selectedAssistant, setSelectedAssistant] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const limit = 20

  // Fetch assistants for filter dropdown
  const fetchAssistants = async () => {
    try {
      const response = await fetch('/api/assistants')
      if (response.ok) {
        const data = await response.json()
        setAssistants(data.assistants || [])
      }
    } catch (error) {
      console.error('Error fetching assistants:', error)
    }
  }

  // Fetch call history
  const fetchCallHistory = async (page: number = 1, reset: boolean = false) => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        ...(selectedAssistant !== 'all' && { assistantId: selectedAssistant }),
        ...(selectedStatus !== 'all' && { status: selectedStatus })
      })

      const response = await fetch(`/api/call-history?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (reset) {
          setCalls(data.calls || [])
          setCurrentPage(1)
        } else {
          setCalls(prev => page === 1 ? data.calls || [] : [...prev, ...(data.calls || [])])
        }
        setStats(data.stats || { totalCalls: 0, totalDuration: 0, totalCost: 0, successRate: 0 })
        setHasMore(data.pagination?.hasMore || false)
      } else {
        setError(data.error || 'Failed to fetch call history')
      }
    } catch (error) {
      setError('Failed to fetch call history')
    } finally {
      setLoading(false)
    }
  }

  // Refresh call history from Vapi
  const refreshCallHistory = async () => {
    try {
      setRefreshing(true)
      setError('')

      const response = await fetch('/api/call-history', {
        method: 'POST'
      })
      const data = await response.json()

      if (response.ok) {
        // Refetch the call history after updating
        await fetchCallHistory(1, true)
      } else {
        setError(data.error || 'Failed to refresh call history')
      }
    } catch (error) {
      setError('Failed to refresh call history')
    } finally {
      setRefreshing(false)
    }
  }

  // Load more calls
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchCallHistory(currentPage + 1)
      setCurrentPage(prev => prev + 1)
    }
  }

  // Filter calls based on search term
  const filteredCalls = calls.filter(call => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      call.assistant_name.toLowerCase().includes(searchLower) ||
      call.phone_number?.toLowerCase().includes(searchLower) ||
      call.vapi_call_id.toLowerCase().includes(searchLower) ||
      call.status.toLowerCase().includes(searchLower)
    )
  })

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Format cost
  const formatCost = (cost?: number) => {
    if (!cost) return 'N/A'
    return `$${cost.toFixed(4)}`
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string, endedReason?: string) => {
    if (status === 'ended') {
      if (endedReason === 'assistant-ended-call') return 'default'
      if (endedReason === 'no-answer') return 'secondary'
      if (endedReason === 'busy') return 'destructive'
      return 'outline'
    }
    if (status === 'in-progress') return 'default'
    if (status === 'ringing') return 'secondary'
    return 'outline'
  }

  // Export call history to CSV
  const exportCSV = () => {
    const headers = ['Date', 'Assistant', 'Status', 'Duration', 'Cost', 'Phone Number', 'Call ID']
    const csvContent = [
      headers.join(','),
      ...filteredCalls.map(call => [
        new Date(call.created_at).toLocaleString(),
        call.assistant_name,
        call.status,
        formatDuration(call.duration),
        formatCost(call.cost),
        call.phone_number || 'N/A',
        call.vapi_call_id
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `call-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (user) {
      fetchAssistants()
      fetchCallHistory(1, true)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchCallHistory(1, true)
    }
  }, [selectedAssistant, selectedStatus])

  if (!user) {
    return (
      <Layout>
        <div className="p-6">
          <p>Please log in to view call history.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Call History
              </h2>
              <p className="text-muted-foreground">
                View and manage your voice assistant call history
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={refreshCallHistory} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-destructive/20 bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalls}</div>
              <p className="text-xs text-muted-foreground">
                All time calls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Successful calls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
              <p className="text-xs text-muted-foreground">
                Total call time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCost(stats.totalCost)}</div>
              <p className="text-xs text-muted-foreground">
                Total call cost
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search calls..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="assistant">Assistant</Label>
                <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                  <SelectTrigger>
                    <SelectValue placeholder="All assistants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All assistants</SelectItem>
                    {assistants.map(assistant => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="ringing">Ringing</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Call History</CardTitle>
            <CardDescription>
              {filteredCalls.length} calls found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading call history...</p>
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="text-center py-8">
                <Phone className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No calls found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCalls.map((call) => (
                  <div key={call.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(call.status, call.ended_reason)}>
                          {call.status}
                        </Badge>
                        {call.ended_reason && (
                          <Badge variant="outline" className="text-xs">
                            {call.ended_reason}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(call.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Assistant</Label>
                        <p className="font-medium">{call.assistant_name}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Duration</Label>
                        <p className="font-medium">{formatDuration(call.duration)}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Cost</Label>
                        <p className="font-medium">{formatCost(call.cost)}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Phone</Label>
                        <p className="font-medium">{call.phone_number || 'N/A'}</p>
                      </div>
                    </div>

                    {call.transcript && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-xs text-muted-foreground">Transcript</Label>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {call.transcript}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t">
                      <Label className="text-xs text-muted-foreground">Call ID</Label>
                      <p className="text-xs font-mono text-muted-foreground">{call.vapi_call_id}</p>
                    </div>
                  </div>
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center pt-4">
                    <Button onClick={loadMore} disabled={loading} variant="outline">
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
