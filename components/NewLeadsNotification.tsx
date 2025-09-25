"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Users, TrendingUp, Facebook, ExternalLink, X } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { getAuthHeaders } from "@/lib/auth"
import { getLastSeenLeadCount, updateLastSeenLeadCount, isNotificationDismissed, markNotificationDismissed } from "@/lib/notifications"

interface NewLead {
  id: number
  name: string
  town: string
  source: string
  score: number
  addedAt: string
}

interface NotificationData {
  newLeadsCount: number
  currentCount: number
  newLeadsDetails: NewLead[]
  lastChecked: string
}

export function NewLeadsNotification() {
  const [isOpen, setIsOpen] = useState(false)
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkForNewLeads()
  }, [])

  const checkForNewLeads = async () => {
    // Don't show notification if recently dismissed
    if (isNotificationDismissed()) {
      return
    }

    setIsLoading(true)
    try {
      const lastSeenCount = getLastSeenLeadCount()
      const response = await fetch(`${API_BASE_URL}/api/notifications/new-leads-since`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lastSeenCount }),
      })

      if (response.ok) {
        const data = await response.json()
        setNotificationData(data)
        
        if (data.newLeadsCount > 0) {
          setIsOpen(true)
        }
      }
    } catch (error) {
      console.error('Error checking for new leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    // Update the last seen count and mark as dismissed
    if (notificationData) {
      updateLastSeenLeadCount(notificationData.currentCount)
      markNotificationDismissed()
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-500" />
      case 'reddit':
        return <ExternalLink className="h-4 w-4 text-orange-500" />
      default:
        return <Users className="h-4 w-4 text-gray-500" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400 border-green-400/50"
    if (score >= 60) return "text-yellow-400 border-yellow-400/50"
    return "text-red-400 border-red-400/50"
  }

  if (!notificationData || notificationData.newLeadsCount === 0) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-slate-700/50 text-slate-100 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-green-400" />
            <span>🎉 New Leads Found!</span>
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {notificationData.newLeadsCount} new lead{notificationData.newLeadsCount !== 1 ? 's' : ''} added since your last visit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <Card className="backdrop-blur-xl bg-slate-800/30 border-slate-600/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {notificationData.newLeadsCount}
                  </div>
                  <div className="text-sm text-white/70">New Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {notificationData.currentCount}
                  </div>
                  <div className="text-sm text-white/70">Total Leads</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Leads List */}
          {notificationData.newLeadsDetails.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Recent Leads:</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notificationData.newLeadsDetails.map((lead) => (
                  <Card key={lead.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getSourceIcon(lead.source)}
                          <div>
                            <div className="font-medium text-white">{lead.name}</div>
                            <div className="text-sm text-white/70">{lead.town}</div>
                            <div className="text-xs text-white/50">
                              Added: {new Date(lead.addedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={`${getScoreColor(lead.score)}`}
                          >
                            {lead.score}
                          </Badge>
                          <Badge variant="outline" className="border-blue-400/50 text-blue-300">
                            {lead.source}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-white/10">
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
            <Button
              onClick={() => {
                handleClose()
                // Scroll to leads section or refresh leads
                window.location.reload()
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Users className="h-4 w-4 mr-2" />
              View All Leads
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
