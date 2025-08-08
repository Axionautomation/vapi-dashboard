'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar, SidebarItem } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { 
  BarChart3, 
  Settings, 
  Home, 
  LogOut,
  Bot,
  User,
  PanelLeft,
  HelpCircle,
  Phone
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-4 w-4" />,
      isActive: pathname === '/dashboard'
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      isActive: pathname === '/analytics'
    },
    {
      title: 'Assistants',
      href: '/assistants',
      icon: <Bot className="h-4 w-4" />,
      isActive: pathname === '/assistants'
    },
    {
      title: 'Call History',
      href: '/call-history',
      icon: <Phone className="h-4 w-4" />,
      isActive: pathname === '/call-history'
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
      isActive: pathname === '/settings'
    },
    {
      title: 'Request Help',
      href: '/request',
      icon: <HelpCircle className="h-4 w-4" />,
      isActive: pathname === '/request'
    }
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className={`${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out border-r`}>
          <Sidebar 
            isCollapsed={isCollapsed} 
            onToggle={() => setIsCollapsed(!isCollapsed)}
            className="h-full"
          >
            {/* Navigation Items */}
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  isActive={item.isActive}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>

            {/* User Section */}
            <div className="mt-auto pt-4 border-t">
              <div className="px-3 py-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className={`text-sm ${isCollapsed ? 'hidden' : 'block'}`}>
                    {user?.email}
                  </span>
                </div>
              </div>
              
              <div className="px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className={isCollapsed ? 'hidden' : 'block'}>
                    Sign Out
                  </span>
                </Button>
              </div>

              <div className="px-3 py-2">
                <ModeToggle />
              </div>
            </div>
          </Sidebar>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center">
                <BarChart3 className="h-6 w-6 text-primary mr-2" />
                <h1 className="text-lg font-semibold text-foreground">
                  Axion Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ModeToggle />
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
} 