"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Bot, Mail, MessageSquare, Phone, Send, Users, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import type { Lead, ContactTemplate, ContactAttempt } from "@/lib/types"
import { mockLeads, mockTemplates } from "@/lib/types"
import { generatePersonalizedMessage, sendAutoContact } from "@/lib/auto-contact"
import { API_BASE_URL } from "@/lib/config"

export default function AutoContactPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  useEffect(() => {
    const fetchLeads = async () => {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/leads`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      setLeads(data.filter((l: Lead) => l.contact_status === "not_contacted"))
    }

    fetchLeads()
  }, [])
  const [templates] = useState<ContactTemplate[]>(mockTemplates)
  const [selectedLeads, setSelectedLeads] = useState<number[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ContactTemplate | null>(null)
  const [contactType, setContactType] = useState<"email" | "sms" | "facebook">("email")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewMessage, setPreviewMessage] = useState("")
  const [contactAttempts, setContactAttempts] = useState<ContactAttempt[]>([])

  const handleLeadSelection = (leadId: number, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId])
    } else {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId))
    }
  }

  const generatePreview = async () => {
    if (selectedLeads.length > 0 && selectedTemplate) {
      const firstLead = leads.find((l) => l.id === selectedLeads[0])
      if (firstLead) {
        const message = await generatePersonalizedMessage(firstLead, selectedTemplate)
        setPreviewMessage(message)
      }
    }
  }

  const handleBulkContact = async () => {
    if (selectedLeads.length === 0 || !selectedTemplate) return

    setIsProcessing(true)
    setProgress(0)

    for (let i = 0; i < selectedLeads.length; i++) {
      const leadId = selectedLeads[i]
      const lead = leads.find((l) => l.id === leadId)

      if (lead) {
        try {
          const personalizedMessage = await generatePersonalizedMessage(lead, selectedTemplate)
          const result = await sendAutoContact(leadId, contactType, personalizedMessage, (attempt) => {
            setContactAttempts((prev) => [attempt, ...prev])
          })

          if (result.success) {
            // Update lead status
            setLeads((prevLeads) =>
              prevLeads.map((l) =>
                l.id === leadId
                  ? {
                      ...l,
                      contact_status: "contacted" as const,
                      last_contacted: new Date().toISOString(),
                    }
                  : l,
              ),
            )
          }

          // Update progress
          setProgress(((i + 1) / selectedLeads.length) * 100)

          // Small delay to prevent rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`Failed to contact lead ${leadId}:`, error)
        }
      }
    }

    setIsProcessing(false)
    setSelectedLeads([])

    // Remove contacted leads from the list
    setLeads((prevLeads) => prevLeads.filter((l) => !selectedLeads.includes(l.id)))
  }

  const qualifiedLeads = leads.filter((l) => l.lead_score >= 70)
  const mediumLeads = leads.filter((l) => l.lead_score >= 50 && l.lead_score < 70)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
            <Bot className="h-8 w-8 text-cyan-400" />
            <span>AI Auto Contact Center</span>
          </h1>
          <p className="text-white/70">Automatically reach out to qualified leads with personalized messages</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm text-white/70">High Priority</p>
                  <p className="text-2xl font-bold text-white">{qualifiedLeads.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-white/70">Medium Priority</p>
                  <p className="text-2xl font-bold text-white">{mediumLeads.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-sm text-white/70">Selected</p>
                  <p className="text-2xl font-bold text-white">{selectedLeads.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Selection */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-xl bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Select Leads to Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <div key={lead.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleLeadSelection(lead.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">
                            {lead.first_name} {lead.last_name}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              lead.lead_score >= 70
                                ? "border-green-400/50 text-green-300"
                                : "border-yellow-400/50 text-yellow-300"
                            }
                          >
                            {lead.lead_score}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/60">
                          {lead.town} • {lead.keywords.join(", ")}
                        </p>
                        {lead.email && (
                          <p className="text-sm text-white/60 flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{lead.email}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/60">No uncontacted leads available</p>
                    <p className="text-white/40 text-sm mt-2">All leads have been contacted or add new leads first</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Configuration */}
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Contact Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-white/90 text-sm font-medium">Contact Method</label>
                  <Select value={contactType} onValueChange={(value: any) => setContactType(value)}>
                    <SelectTrigger className="bg-white/10 border-white/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>Email</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>SMS</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="facebook">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>Facebook</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white/90 text-sm font-medium">Message Template</label>
                  <Select
                    value={selectedTemplate?.id.toString() || ""}
                    onValueChange={(value) => {
                      const template = templates.find((t) => t.id.toString() === value)
                      setSelectedTemplate(template || null)
                    }}
                  >
                    <SelectTrigger className="bg-white/10 border-white/30 text-white">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates
                        .filter((t) => t.type === contactType)
                        .map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generatePreview}
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/10 bg-transparent"
                  disabled={selectedLeads.length === 0 || !selectedTemplate}
                >
                  Generate Preview
                </Button>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-cyan-400">
                      <Bot className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Sending messages...</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <Button
                  onClick={handleBulkContact}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  disabled={selectedLeads.length === 0 || !selectedTemplate || isProcessing}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to {selectedLeads.length} Lead{selectedLeads.length !== 1 ? "s" : ""}
                </Button>
              </CardContent>
            </Card>

            {/* Message Preview */}
            {previewMessage && (
              <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Message Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={previewMessage}
                    readOnly
                    className="bg-white/10 border-white/30 text-white text-sm"
                    rows={8}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Contact Attempts */}
        {contactAttempts.length > 0 && (
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 mt-8">
            <CardHeader>
              <CardTitle className="text-white">Recent Contact Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contactAttempts.slice(0, 5).map((attempt) => {
                  const lead = mockLeads.find((l) => l.id === attempt.lead_id)
                  return (
                    <div key={attempt.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <span className="text-white font-medium">
                          {lead?.first_name} {lead?.last_name}
                        </span>
                        <p className="text-white/60 text-sm">
                          {attempt.contact_type} • {new Date(attempt.sent_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-green-400/50 text-green-300">
                        Sent
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
