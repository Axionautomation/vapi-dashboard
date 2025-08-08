'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Layout } from '@/components/layout'
import { Loader2, Plus, Bot, Trash2, RefreshCw, Edit3, Save, X } from 'lucide-react'
import { Assistant } from '@/lib/database'

interface VapiAssistant {
  name: string
  model?: {
    provider?: string
    model?: string
    messages?: Array<{
      role: string
      content: string
    }>
  }
  voice?: {
    provider?: string
    voiceId?: string
  }
  transcriber?: {
    provider?: string
    model?: string
    language?: string
  }
  firstMessage?: string
  firstMessageInterruptionsEnabled?: boolean
  firstMessageMode?: string | null
  voicemailDetection?: {
    provider?: string
  }
  maxDurationSeconds?: number
  backgroundSound?: any
  modelOutputInMessagesEnabled?: boolean
  transportConfigurations?: any[]
  observabilityPlan?: {
    provider?: string
    tags?: string[]
  }
  credentials?: any[]
  hooks?: any[]
  voicemailMessage?: string
  endCallMessage?: string
  endCallPhrases?: string[]
  compliancePlan?: any
  metadata?: any
  backgroundSpeechDenoisingPlan?: any
  analysisPlan?: any
  artifactPlan?: any
  startSpeakingPlan?: any
  stopSpeakingPlan?: any
  monitorPlan?: any
  credentialIds?: string[]
  server?: any
  keypadInputPlan?: any
}

// Configuration options for user-friendly dropdowns
const CONFIG_OPTIONS = {
  modelProviders: [
    { value: 'openai', label: 'OpenAI (GPT-4, GPT-3.5)' },
    { value: 'anthropic', label: 'Anthropic (Claude)' },
    { value: 'google', label: 'Google (Gemini)' },
    { value: 'custom-llm', label: 'Custom LLM' }
  ],
  models: {
    openai: [
      { value: 'gpt-4o', label: 'GPT-4o (Latest & Most Capable) - $0.005/1K tokens', price: 'High' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Efficient) - $0.00015/1K tokens', price: 'Low' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo - $0.01/1K tokens', price: 'High' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo - $0.0005/1K tokens', price: 'Low' }
    ],
    anthropic: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Latest) - $0.003/1K tokens', price: 'Medium' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus - $0.015/1K tokens', price: 'High' },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet - $0.003/1K tokens', price: 'Medium' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku - $0.00025/1K tokens', price: 'Low' }
    ],
    google: [
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro - $0.0035/1K tokens', price: 'Medium' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash - $0.000075/1K tokens', price: 'Low' },
      { value: 'gemini-pro', label: 'Gemini Pro - $0.0005/1K tokens', price: 'Low' }
    ]
  },
  voiceProviders: [
    { value: 'elevenlabs', label: 'ElevenLabs (High Quality)' },
    { value: 'cartesia', label: 'Cartesia (Premium Voices)' }
  ],
  voiceIds: {
    elevenlabs: [
      { value: 'elevenlabs_21m00Tcm4T812qj9c0nL', label: 'Rachel (Female - Professional)' },
      { value: 'elevenlabs_2EiwWnXFnvU5JabPnvh6', label: 'Domi (Female - Friendly)' },
      { value: 'elevenlabs_GBv7mTt0atIp3Br8iCZE', label: 'Bella (Female - Warm)' },
      { value: 'elevenlabs_EXAVITQu4vr4xnSDxMaL', label: 'Antoni (Male - Professional)' },
      { value: 'elevenlabs_pNInz6obpgDQGcFmaJgB', label: 'Adam (Male - Friendly)' },
      { value: 'elevenlabs_yoZ06aMxZJJ28mfd3POQ', label: 'Sam (Male - Casual)' }
    ],
    cartesia: [
      { value: 'cartesia_emma', label: 'Emma (Female - Professional)' },
      { value: 'cartesia_james', label: 'James (Male - Authoritative)' },
      { value: 'cartesia_sarah', label: 'Sarah (Female - Warm)' },
      { value: 'cartesia_michael', label: 'Michael (Male - Friendly)' },
      { value: 'cartesia_lisa', label: 'Lisa (Female - Casual)' },
      { value: 'cartesia_david', label: 'David (Male - Professional)' }
    ]
  }
}

export default function AssistantsPage() {
  const { user } = useAuth()
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [loading, setLoading] = useState(true)
  const [addingAssistant, setAddingAssistant] = useState(false)
  const [editingAssistant, setEditingAssistant] = useState<string | null>(null)
  const [assistantId, setAssistantId] = useState('')
  const [assistantName, setAssistantName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Edit form states
  const [editForm, setEditForm] = useState<VapiAssistant>({
    name: '',
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        }
      ]
    },
    voice: {
      provider: 'elevenlabs',
      voiceId: 'elevenlabs_21m00Tcm4T812qj9c0nL'
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'multi'
    },
    firstMessage: '',
    firstMessageInterruptionsEnabled: false,
    firstMessageMode: null,
    voicemailDetection: {
      provider: 'google'
    },
    maxDurationSeconds: 300,
    backgroundSound: null,
    modelOutputInMessagesEnabled: false,
    transportConfigurations: [],
    observabilityPlan: {
      provider: 'langfuse',
      tags: []
    },
    credentials: [],
    hooks: [],
    voicemailMessage: '',
    endCallMessage: '',
    endCallPhrases: [],
    compliancePlan: {},
    metadata: {},
    backgroundSpeechDenoisingPlan: {},
    analysisPlan: {},
    artifactPlan: {},
    startSpeakingPlan: {},
    stopSpeakingPlan: {},
    monitorPlan: {},
    credentialIds: [],
    server: {},
    keypadInputPlan: {}
  })

  // Fetch assistants on component mount
  useEffect(() => {
    if (user) {
      fetchAssistants()
    }
  }, [user])

  const fetchAssistants = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/assistants')
      const data = await response.json()
      
      if (response.ok) {
        setAssistants(data.assistants || [])
      } else {
        setError(data.error || 'Failed to fetch assistants')
      }
    } catch (error) {
      setError('Failed to fetch assistants')
    } finally {
      setLoading(false)
    }
  }

  const addAssistant = async () => {
    if (!assistantId.trim()) {
      setError('Assistant ID is required')
      return
    }

    try {
      setAddingAssistant(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: assistantId.trim(),
          name: assistantName.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Assistant added successfully!')
        setAssistantId('')
        setAssistantName('')
        fetchAssistants() // Refresh the list
      } else {
        setError(data.error || 'Failed to add assistant')
      }
    } catch (error) {
      setError('Failed to add assistant')
    } finally {
      setAddingAssistant(false)
    }
  }

  const deleteAssistant = async (assistantId: string) => {
    if (!confirm('Are you sure you want to delete this assistant?')) {
      return
    }

    try {
      const response = await fetch(`/api/assistants/${assistantId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('Assistant deleted successfully!')
        fetchAssistants() // Refresh the list
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete assistant')
      }
    } catch (error) {
      setError('Failed to delete assistant')
    }
  }

  const startEditing = async (assistant: Assistant) => {
    try {
      setLoading(true)
      setError('')

      // Fetch the assistant details from Vapi
      const response = await fetch(`/api/assistants/${assistant.vapi_assistant_id}`)
      const data = await response.json()

      if (response.ok && data.assistant) {
        setEditForm({
          name: data.assistant.name || assistant.name,
          model: data.assistant.model || {
            provider: 'openai',
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant.'
              }
            ]
          },
          voice: data.assistant.voice || {
            provider: 'elevenlabs',
            voiceId: 'elevenlabs_21m00Tcm4T812qj9c0nL'
          },
          transcriber: data.assistant.transcriber || {
            provider: 'deepgram',
            model: 'nova-2',
            language: 'multi'
          },
          firstMessage: data.assistant.firstMessage || '',
          firstMessageInterruptionsEnabled: data.assistant.firstMessageInterruptionsEnabled || false,
          firstMessageMode: data.assistant.firstMessageMode || null,
          voicemailDetection: data.assistant.voicemailDetection || {
            provider: 'google'
          },
          maxDurationSeconds: data.assistant.maxDurationSeconds || 300,
          backgroundSound: data.assistant.backgroundSound || null,
          modelOutputInMessagesEnabled: data.assistant.modelOutputInMessagesEnabled || false,
          transportConfigurations: data.assistant.transportConfigurations || [],
          observabilityPlan: data.assistant.observabilityPlan || {
            provider: 'langfuse',
            tags: []
          },
          credentials: data.assistant.credentials || [],
          hooks: data.assistant.hooks || [],
          voicemailMessage: data.assistant.voicemailMessage || '',
          endCallMessage: data.assistant.endCallMessage || '',
          endCallPhrases: data.assistant.endCallPhrases || [],
          compliancePlan: data.assistant.compliancePlan || {},
          metadata: data.assistant.metadata || {},
          backgroundSpeechDenoisingPlan: data.assistant.backgroundSpeechDenoisingPlan || {},
          analysisPlan: data.assistant.analysisPlan || {},
          artifactPlan: data.assistant.artifactPlan || {},
          startSpeakingPlan: data.assistant.startSpeakingPlan || {},
          stopSpeakingPlan: data.assistant.stopSpeakingPlan || {},
          monitorPlan: data.assistant.monitorPlan || {},
          credentialIds: data.assistant.credentialIds || [],
          server: data.assistant.server || {},
          keypadInputPlan: data.assistant.keypadInputPlan || {}
        })
        setEditingAssistant(assistant.vapi_assistant_id)
      } else {
        setError('Failed to fetch assistant details')
      }
    } catch (error) {
      setError('Failed to fetch assistant details')
    } finally {
      setLoading(false)
    }
  }

  const saveAssistant = async () => {
    if (!editingAssistant) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(`/api/assistants/${editingAssistant}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Assistant updated successfully!')
        setEditingAssistant(null)
        
        // Refresh the assistants list to get the latest data from Vapi
        await fetchAssistants()
        
        // Also refresh the specific assistant data to ensure we have the latest
        if (editingAssistant) {
          try {
            const refreshResponse = await fetch(`/api/assistants/${editingAssistant}`)
            if (refreshResponse.ok) {
              console.log('Assistant data refreshed from Vapi')
            }
          } catch (refreshError) {
            console.log('Could not refresh assistant data:', refreshError)
          }
        }
      } else {
        setError(data.error || 'Failed to update assistant')
      }
    } catch (error) {
      setError('Failed to update assistant')
    } finally {
      setLoading(false)
    }
  }

  const cancelEditing = () => {
    setEditingAssistant(null)
    setEditForm({
      name: '',
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          }
        ]
      },
      voice: {
        provider: 'elevenlabs',
        voiceId: 'elevenlabs_21m00Tcm4T812qj9c0nL'
      },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'multi'
      },
      firstMessage: '',
      firstMessageInterruptionsEnabled: false,
      firstMessageMode: null,
      voicemailDetection: {
        provider: 'google'
      },
      maxDurationSeconds: 300,
      backgroundSound: null,
      modelOutputInMessagesEnabled: false,
      transportConfigurations: [],
      observabilityPlan: {
        provider: 'langfuse',
        tags: []
      },
      credentials: [],
      hooks: [],
      voicemailMessage: '',
      endCallMessage: '',
      endCallPhrases: [],
      compliancePlan: {},
      metadata: {},
      backgroundSpeechDenoisingPlan: {},
      analysisPlan: {},
      artifactPlan: {},
      startSpeakingPlan: {},
      stopSpeakingPlan: {},
      monitorPlan: {},
      credentialIds: [],
      server: {},
      keypadInputPlan: {}
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading assistants...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Assistant Management
              </h2>
              <p className="text-muted-foreground">
                Manage your Vapi voice assistants and monitor their performance.
              </p>
            </div>
            <Button onClick={fetchAssistants} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Add Assistant Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Assistant</CardTitle>
            <CardDescription>
              Add a Vapi assistant to your dashboard by providing its Assistant ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assistantId">Assistant ID *</Label>
                <Input
                  id="assistantId"
                  placeholder="Enter Vapi Assistant ID"
                  value={assistantId}
                  onChange={(e) => setAssistantId(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="assistantName">Display Name (Optional)</Label>
                <Input
                  id="assistantName"
                  placeholder="Enter a custom name"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <Button 
              onClick={addAssistant} 
              disabled={addingAssistant || !assistantId.trim()}
              className="mt-4"
            >
              {addingAssistant ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assistant
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error/Success Messages */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-green-600">{success}</p>
            </CardContent>
          </Card>
        )}

        {/* Assistants List */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Your Assistants</h3>
          
          {assistants.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No assistants yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first Vapi assistant to get started
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assistants.map((assistant) => (
                <Card key={assistant.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{assistant.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(assistant)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAssistant(assistant.vapi_assistant_id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      ID: {assistant.vapi_assistant_id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {assistant.description && (
                        <p className="text-sm text-muted-foreground">
                          {assistant.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="font-medium">{assistant.model || 'Default'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Voice:</span>
                        <span className="font-medium">{assistant.voice || 'Default'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">
                          {new Date(assistant.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingAssistant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Edit Assistant</h2>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={cancelEditing}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={saveAssistant} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="editName">Assistant Name</Label>
                        <Input
                          id="editName"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editFirstMessage">First Message</Label>
                        <Input
                          id="editFirstMessage"
                          value={editForm.firstMessage}
                          onChange={(e) => setEditForm({...editForm, firstMessage: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editMaxDuration">Max Duration (seconds)</Label>
                        <Input
                          id="editMaxDuration"
                          type="number"
                          min="10"
                          value={editForm.maxDurationSeconds}
                          onChange={(e) => setEditForm({...editForm, maxDurationSeconds: parseInt(e.target.value) || 300})}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum 10 seconds
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Model Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Model Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="editModelProvider">Model Provider</Label>
                        <select
                          id="editModelProvider"
                          value={editForm.model?.provider}
                          onChange={(e) => setEditForm({
                            ...editForm, 
                            model: {
                              ...editForm.model, 
                              provider: e.target.value,
                              model: CONFIG_OPTIONS.models[e.target.value as keyof typeof CONFIG_OPTIONS.models]?.[0]?.value || 'gpt-4o'
                            }
                          })}
                          className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        >
                          {CONFIG_OPTIONS.modelProviders.map((provider) => (
                            <option key={provider.value} value={provider.value}>
                              {provider.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="editModel">Model</Label>
                        <select
                          id="editModel"
                          value={editForm.model?.model}
                          onChange={(e) => setEditForm({
                            ...editForm, 
                            model: {...editForm.model, model: e.target.value}
                          })}
                          className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        >
                          {CONFIG_OPTIONS.models[editForm.model?.provider as keyof typeof CONFIG_OPTIONS.models]?.map((model) => (
                            <option key={model.value} value={model.value}>
                              {model.label}
                            </option>
                          )) || []}
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Voice Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Voice Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="editVoiceProvider">Voice Provider</Label>
                        <select
                          id="editVoiceProvider"
                          value={editForm.voice?.provider}
                          onChange={(e) => setEditForm({
                            ...editForm, 
                            voice: {
                              ...editForm.voice, 
                              provider: e.target.value,
                              voiceId: CONFIG_OPTIONS.voiceIds[e.target.value as keyof typeof CONFIG_OPTIONS.voiceIds]?.[0]?.value || 'elevenlabs_21m00Tcm4T812qj9c0nL'
                            }
                          })}
                          className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        >
                          {CONFIG_OPTIONS.voiceProviders.map((provider) => (
                            <option key={provider.value} value={provider.value}>
                              {provider.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="editVoiceId">Voice</Label>
                        <select
                          id="editVoiceId"
                          value={editForm.voice?.voiceId}
                          onChange={(e) => setEditForm({
                            ...editForm, 
                            voice: {...editForm.voice, voiceId: e.target.value}
                          })}
                          className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                        >
                          {CONFIG_OPTIONS.voiceIds[editForm.voice?.provider as keyof typeof CONFIG_OPTIONS.voiceIds]?.map((voice) => (
                            <option key={voice.value} value={voice.value}>
                              {voice.label}
                            </option>
                          )) || []}
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Prompt */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>System Prompt</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        value={editForm.model?.messages?.[0]?.content || ''}
                        onChange={(e) => setEditForm({
                          ...editForm, 
                          model: {
                            ...editForm.model,
                            messages: [
                              {
                                role: 'system',
                                content: e.target.value
                              }
                            ]
                          }
                        })}
                        rows={6}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm resize-none"
                        placeholder="Enter the system prompt that defines your assistant's behavior..."
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 