"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ 
  className, 
  isCollapsed = false, 
  onToggle,
  children,
  ...props 
}: SidebarProps) {
  return (
    <div
      className={cn(
        "flex h-full border-r bg-background",
        className
      )}
      {...props}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex h-[52px] items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggle}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 py-2">
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

interface SidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  href?: string
  isActive?: boolean
  isCollapsed?: boolean
}

export function SidebarItem({ 
  className, 
  icon, 
  title, 
  href,
  isActive = false,
  isCollapsed = false,
  ...props 
}: SidebarItemProps) {
  const Comp = href ? "a" : "div"
  
  return (
    <Comp
      href={href}
      className={cn(
        "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
        isActive && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mr-2 h-4 w-4">
          {icon}
        </div>
      )}
      {!isCollapsed && <span className="truncate">{title}</span>}
    </Comp>
  )
}
