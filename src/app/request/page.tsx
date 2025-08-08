'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Layout } from '@/components/layout'
import { HelpCircle, Send, MessageSquare, Settings, Bot, BarChart3 } from 'lucide-react'

export default function RequestPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Form states
  const [requestType, setRequestType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [email, setEmail] = useState('')

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSuccess('Request submitted successfully! We\'ll get back to you soon.')
      setTitle('')
      setDescription('')
      setRequestType('')
      setPriority('medium')
    } catch (error) {
      setError('Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const requestTypes = [
    {
      id: 'feature',
      title: 'Feature Request',
      description: 'Request a new feature or functionality',
      icon: <Settings className="h-5 w-5" />
    },
    {
      id: 'bug',
      title: 'Bug Report',
      description: 'Report an issue or bug you\'ve encountered',
      icon: <HelpCircle className="h-5 w-5" />
    },
    {
      id: 'integration',
      title: 'Integration Help',
      description: 'Need help with Vapi or other integrations',
      icon: <Bot className="h-5 w-5" />
    },
    {
      id: 'analytics',
      title: 'Analytics Request',
      description: 'Request new analytics or reporting features',
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      id: 'custom',
      title: 'Custom Request',
      description: 'Something else not covered above',
      icon: <MessageSquare className="h-5 w-5" />
    }
  ]

  return (
    <Layout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Request Help
          </h2>
          <p className="text-muted-foreground">
            Need help or want to request changes? Let us know what you need.
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-green-600">{success}</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 border-destructive/20 bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Submit Your Request</CardTitle>
                <CardDescription>
                  Tell us what you need help with or what changes you'd like to see
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Request Type */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Request Type *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {requestTypes.map((type) => (
                      <div
                        key={type.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          requestType === type.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setRequestType(type.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-md ${
                            requestType === type.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            {type.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">{type.title}</h3>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of your request"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    rows={6}
                    placeholder="Please provide detailed information about your request, including any specific requirements, steps to reproduce issues, or examples..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm resize-none mt-1"
                  />
                </div>

                {/* Priority */}
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="low">Low - Nice to have</option>
                    <option value="medium">Medium - Important</option>
                    <option value="high">High - Critical</option>
                  </select>
                </div>

                {/* Contact Email */}
                <div>
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Where should we contact you? (optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank to use your account email: {user?.email}
                  </p>
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || !title.trim() || !description.trim() || !requestType}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Help & Guidelines */}
          <div className="space-y-6">
            {/* Quick Help */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Quick Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Need Immediate Help?</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    For urgent issues, check our documentation or contact support directly.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      View Documentation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Request Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Be specific about what you need or what's not working</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Include steps to reproduce issues if reporting bugs</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Provide examples or screenshots when possible</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>We typically respond within 24-48 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">Add export functionality</p>
                    <p className="text-xs text-muted-foreground">Submitted 2 days ago</p>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mt-1">
                      In Progress
                    </span>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">Fix analytics chart display</p>
                    <p className="text-xs text-muted-foreground">Submitted 1 week ago</p>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded mt-1">
                      Completed
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
} 