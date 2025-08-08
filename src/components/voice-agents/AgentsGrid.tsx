'use client'

import { AgentCard } from './AgentCard'

interface Agent {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive'
  tools: string[]
  callsToday: number
  successRate: number
}

interface AgentsGridProps {
  agents: Agent[]
  onEdit: (agentId: string) => void
  onDelete: (agentId: string) => void
}

export function AgentsGrid({ agents, onEdit, onDelete }: AgentsGridProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No voice agents yet</h3>
        <p className="text-muted-foreground mb-4">Create your first voice assistant to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map(agent => (
        <AgentCard 
          key={agent.id} 
          agent={agent} 
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
} 