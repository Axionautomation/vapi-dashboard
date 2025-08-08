'use client'

import { useState } from 'react'
import { AgentsGrid } from './AgentsGrid'
import { AgentBuilderModal } from './AgentBuilderModal'

// Mock data for demonstration
const mockAgents = [
  {
    id: '1',
    name: 'Calendar Assistant',
    description: 'Helps schedule meetings and manage calendar',
    status: 'active',
    tools: ['Google Calendar', 'Email'],
    callsToday: 12,
    successRate: 85
  },
  {
    id: '2',
    name: 'Customer Support Bot',
    description: 'Handles customer inquiries and support tickets',
    status: 'active',
    tools: ['Zendesk', 'Knowledge Base'],
    callsToday: 8,
    successRate: 92
  },
  {
    id: '3',
    name: 'Sales Assistant',
    description: 'Qualifies leads and schedules demos',
    status: 'inactive',
    tools: ['CRM', 'Calendar'],
    callsToday: 0,
    successRate: 78
  }
]

export function VoiceAgentsContent() {
  const [agents, setAgents] = useState(mockAgents)
  const [showBuilder, setShowBuilder] = useState(false)

  const handleSaveAgent = (newAgent: any) => {
    setAgents(prev => [...prev, { ...newAgent, id: Date.now().toString() }])
    setShowBuilder(false)
  }

  const handleEditAgent = (agentId: string) => {
    // TODO: Implement edit functionality
    console.log('Edit agent:', agentId)
  }

  const handleDeleteAgent = (agentId: string) => {
    setAgents(prev => prev.filter(agent => agent.id !== agentId))
  }

  return (
    <div className="space-y-6">
      <AgentsGrid 
        agents={agents} 
        onEdit={handleEditAgent}
        onDelete={handleDeleteAgent}
      />
      {showBuilder && (
        <AgentBuilderModal 
          onSave={handleSaveAgent}
          onClose={() => setShowBuilder(false)}
        />
      )}
    </div>
  )
} 