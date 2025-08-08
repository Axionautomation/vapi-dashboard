'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface VoiceAgentsHeaderProps {
  onCreateAgent?: () => void
}

export function VoiceAgentsHeader({ onCreateAgent }: VoiceAgentsHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Voice Agents</h1>
        <p className="text-muted-foreground">Create and manage your AI voice assistants</p>
      </div>
      <Button onClick={onCreateAgent} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create Voice Agent
      </Button>
    </div>
  )
} 