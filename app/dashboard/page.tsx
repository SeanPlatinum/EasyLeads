"use client"

import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Search,
  MapPin,
  Facebook,
  Snowflake,
  Thermometer,
  Filter,
  Mail,
  Phone,
  MessageSquare,
  Bot,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  ExternalLink,
  Home,
  Settings,
  Send,
  MoreHorizontal,
} from "lucide-react"
import type { Lead, ContactAttempt } from "@/lib/types"
import { enrichLeadWithAI, simulateWebScraping } from "@/lib/ai-lead-enrichment"
import { sendAutoContact } from "@/lib/auto-contact"

const towns = ["Springfield", "Riverside", "Oakville", "Millfield", "Brookside", "Watertown", "Attleboro", "Taunton", "Unknown"]

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [contactAttempts, setContactAttempts] = useState<ContactAttempt[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTown, setSelectedTown] = useState("all")
  const [selectedSource, setSelectedSource] = useState("all")
  const [currentView, setCurrentView] = useState("all-leads")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [newLead, setNewLead] = useState({
    firstName: "",
    lastName: "",
    facebookName: "",
    town: "",
    groupName: "",
    keywords: [] as string[],
    notes: "",
  })

  const [isAutoContactEnabled, setIsAutoContactEnabled] = useState(false)

  // Fetch leads from API on component mount
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/leads')
        if (response.ok) {
          const data = await response.json()
          setLeads(data)
        } else {
          console.error('Failed to fetch leads:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching leads:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeads()
  }, [])

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      searchTerm === "" ||
      lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.facebook_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTown = selectedTown === "all" || lead.town === selectedTown
    
    const matchesSource = selectedSource === "all" || 
      (selectedSource === "facebook" && (!lead.source || lead.source === "facebook")) ||
      (selectedSource === "reddit" && lead.source === "reddit")

    return matchesSearch && matchesTown && matchesSource
  })

  const leadsByTown = towns.reduce(
    (acc, town) => {
      acc[town] = leads.filter((lead) => lead.town === town)
      return acc
    },
    {} as Record<string, Lead[]>,
  )

  const handleAddLead = async () => {
    setIsEnriching(true)

    try {
      const scrapedData = await simulateWebScraping(newLead.facebookName, newLead.town)
      const enrichmentData = await enrichLeadWithAI({
        firstName: newLead.firstName,
        lastName: newLead.lastName,
        facebookName: newLead.facebookName,
        town: newLead.town,
        groupName: newLead.groupName,
        keywords: newLead.keywords,
        notes: newLead.notes,
        scrapedData,
      })

      const newLeadData: Lead = {
        id: Date.now(),
        first_name: newLead.firstName,
        last_name: newLead.lastName,
        facebook_name: newLead.facebookName,
        email: enrichmentData?.email || scrapedData.contactHints.emailPattern,
        phone: enrichmentData?.phone || scrapedData.contactHints.phonePattern,
        town: newLead.town,
        group_name: newLead.groupName,
        keywords: newLead.keywords,
        notes: newLead.notes,
        lead_score: enrichmentData?.leadScore || 50,
        status: "new",
        contact_status: "not_contacted",
        date_added: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile_data: {
          scraped: scrapedData,
          enrichment: enrichmentData,
        },
      }

      setLeads([newLeadData, ...leads])
      setNewLead({
        firstName: "",
        lastName: "",
        facebookName: "",
        town: "",
        groupName: "",
        keywords: [],
        notes: "",
      })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding lead:", error)
    } finally {
      setIsEnriching(false)
    }
  }

  const handleManualContact = async (lead: Lead, contactType: "email" | "sms" | "facebook", message: string) => {
    try {
      const result = await sendAutoContact(lead.id, contactType, message, (attempt) => {
        setContactAttempts((prev) => [attempt, ...prev])
      })

      if (result.success) {
        setLeads((prevLeads) =>
          prevLeads.map((l) =>
            l.id === lead.id
              ? {
                  ...l,
                  contact_status: "contacted" as const,
                  last_contacted: new Date().toISOString(),
                }
              : l,
          ),
        )
      }

      return result
    } catch (error) {
      console.error("Manual contact failed:", error)
      return { success: false, error }
    }
  }

  const stats = {
    totalLeads: leads.length,
    newLeads: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.contact_status === "contacted").length,
    responded: leads.filter((l) => l.contact_status === "responded").length,
  }

  const renderContent = () => {
    switch (currentView) {
      case "auto-contact":
        return (
          <AutoContactView
            leads={leads}
            onContactSent={(attempt) => setContactAttempts([attempt, ...contactAttempts])}
          />
        )
      case "responses":
        return <ResponsesView leads={leads} contactAttempts={contactAttempts} />
      case "settings":
        return <SettingsView isAutoContactEnabled={isAutoContactEnabled} />
      default:
        if (currentView.startsWith("town-")) {
          const town = currentView.replace("town-", "")
          return (
            <div className="grid gap-4">
              {leadsByTown[town]?.map((lead) => (
                <EnhancedLeadCard key={lead.id} lead={lead} onManualContact={handleManualContact} />
              ))}
            </div>
          )
        }
        return (
          <div className="grid gap-4">
            {filteredLeads.map((lead) => (
              <EnhancedLeadCard key={lead.id} lead={lead} onManualContact={handleManualContact} />
            ))}
          </div>
        )
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar currentView={currentView} onViewChange={setCurrentView} leadsByTown={leadsByTown} />
      <SidebarInset>
        {/* Header */}
        <div className="backdrop-blur-xl bg-slate-900/90 border-b border-slate-700/50 sticky top-0 z-50">
          <div className="flex items-center justify-between px-2 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <SidebarTrigger className="text-white hover:bg-white/10" />
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                  <Snowflake className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500">
                  <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white hidden xs:block">HVAC Lead Tracker</h1>
              <h1 className="text-sm font-bold text-white xs:hidden">HVAC</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Badge
                variant="secondary"
                className="bg-slate-700/50 text-slate-100 border-slate-600/50 text-xs sm:text-sm px-2 py-1"
              >
                {leads.length} Leads
              </Badge>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                size="sm"
                className="border-red-400/50 text-red-300 hover:bg-red-500/20 hover:border-red-400 text-xs sm:text-sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=100&width=100')] opacity-5"></div>

          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Card className="backdrop-blur-xl bg-slate-800/30 border-slate-600/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-white/70">Total Leads</p>
                      <p className="text-2xl font-bold text-white">{stats.totalLeads}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-xl bg-slate-800/30 border-slate-600/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm text-white/70">New Leads</p>
                      <p className="text-2xl font-bold text-white">{stats.newLeads}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-xl bg-slate-800/30 border-slate-600/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-indigo-400" />
                    <div>
                      <p className="text-sm text-white/70">Contacted</p>
                      <p className="text-2xl font-bold text-white">{stats.contacted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-xl bg-slate-800/30 border-slate-600/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-teal-400" />
                    <div>
                      <p className="text-sm text-white/70">Responded</p>
                      <p className="text-2xl font-bold text-white">{stats.responded}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter Bar - Only show for leads views */}
            {(currentView === "all-leads" || currentView.startsWith("town-")) && (
              <Card className="backdrop-blur-xl bg-slate-800/30 border-slate-600/30 mb-8">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                      <Input
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 backdrop-blur-sm bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-white/60 h-10 sm:h-auto"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Select value={selectedTown} onValueChange={setSelectedTown}>
                        <SelectTrigger className="w-full sm:w-48 backdrop-blur-sm bg-slate-800/50 border-slate-600/50 text-slate-100">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter by town" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Towns</SelectItem>
                          {towns.map((town) => (
                            <SelectItem key={town} value={town}>
                              {town}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedSource} onValueChange={setSelectedSource}>
                        <SelectTrigger className="w-full sm:w-48 backdrop-blur-sm bg-slate-800/50 border-slate-600/50 text-slate-100">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter by source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          <SelectItem value="facebook">
                            <div className="flex items-center space-x-2">
                              <Facebook className="h-4 w-4" />
                              <span>Facebook</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="reddit">
                            <div className="flex items-center space-x-2">
                              <ExternalLink className="h-4 w-4" />
                              <span>Reddit</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => setIsAutoContactEnabled(!isAutoContactEnabled)}
                        className={`w-full sm:w-auto transition-all duration-300 ${
                          isAutoContactEnabled
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
                        }`}
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        Auto Contact {isAutoContactEnabled ? "ON" : "OFF"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Town Tabs - Only show for leads views */}
            {(currentView === "all-leads" || currentView.startsWith("town-")) && (
              <Tabs
                value={currentView === "all-leads" ? "all" : currentView.replace("town-", "")}
                className="mb-4 sm:mb-6"
              >
                <div className="overflow-x-auto">
                  <TabsList className="backdrop-blur-xl bg-slate-800/30 border-slate-600/30 p-1 w-max sm:w-auto">
                    <TabsTrigger
                      value="all"
                      onClick={() => setCurrentView("all-leads")}
                      className="data-[state=active]:bg-white/20 text-white whitespace-nowrap text-xs sm:text-sm"
                    >
                      All ({filteredLeads.length})
                    </TabsTrigger>
                    {towns.map((town) => (
                      <TabsTrigger
                        key={town}
                        value={town}
                        onClick={() => setCurrentView(`town-${town}`)}
                        className="data-[state=active]:bg-white/20 text-white whitespace-nowrap text-xs sm:text-sm"
                      >
                        {town} ({leadsByTown[town]?.length || 0})
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>
            )}

            {/* Main Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-white/70">Loading leads...</div>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function AppSidebar({
  currentView,
  onViewChange,
  leadsByTown,
}: {
  currentView: string
  onViewChange: (view: string) => void
  leadsByTown: Record<string, Lead[]>
}) {
  return (
    <Sidebar className="border-r border-slate-700/50">
      <SidebarContent className="bg-gradient-to-b from-slate-900/80 to-purple-900/60">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onViewChange("all-leads")}
                  isActive={currentView === "all-leads"}
                  className="text-white hover:bg-white/10 data-[active=true]:bg-white/20"
                >
                  <Home className="h-4 w-4" />
                  <span>All Leads</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="flex-1 py-6">
          <SidebarGroupLabel className="text-white/70 text-lg font-semibold mb-4 px-2">Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onViewChange("auto-contact")}
                  isActive={currentView === "auto-contact"}
                  className="text-white hover:bg-white/10 data-[active=true]:bg-white/20 h-12 px-4 text-base font-medium"
                >
                  <Bot className="h-5 w-5" />
                  <span>Auto Contact</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onViewChange("responses")}
                  isActive={currentView === "responses"}
                  className="text-white hover:bg-white/10 data-[active=true]:bg-white/20 h-12 px-4 text-base font-medium"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Lead Responses</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onViewChange("settings")}
                  isActive={currentView === "settings"}
                  className="text-white hover:bg-white/10 data-[active=true]:bg-white/20 h-12 px-4 text-base font-medium"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

function EnhancedLeadCard({
  lead,
  onManualContact,
}: {
  lead: Lead
  onManualContact: (lead: Lead, contactType: "email" | "sms" | "facebook", message: string) => Promise<any>
}) {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [contactType, setContactType] = useState<"email" | "sms" | "facebook">("email")
  const [contactMessage, setContactMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400 border-green-400/50"
    if (score >= 60) return "text-yellow-400 border-yellow-400/50"
    return "text-red-400 border-red-400/50"
  }

  const handleSendMessage = async () => {
    if (!contactMessage.trim()) return

    setIsSending(true)
    try {
      const result = await onManualContact(lead, contactType, contactMessage)
      if (result.success) {
        setIsContactDialogOpen(false)
        setContactMessage("")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const getDefaultMessage = () => {
    const firstName = lead.first_name
    const town = lead.town
    const keywords = lead.keywords.join(", ")

    switch (contactType) {
      case "email":
        return `Hi ${firstName},

I noticed your recent post about ${keywords} in your local ${town} group. 

As a local HVAC professional serving ${town}, I'd love to help you with your heating and cooling needs. We specialize in:

• Heat pump installations and repairs
• Mini-split systems
• AC maintenance and replacement
• Energy-efficient solutions

I'm offering a FREE consultation to discuss your specific needs. Would you be interested in a quick 15-minute call this week?

Best regards,
[Your HVAC Business]`

      case "sms":
        return `Hi ${firstName}! Saw your post about ${keywords} in your ${town} group. Local HVAC pro here - offering free consultation. Interested? Reply YES for details!`

      case "facebook":
        return `Hi ${firstName}! I saw your post about ${keywords}. I'm a local HVAC contractor in ${town} and would love to help. Sending you a PM with some options!`

      default:
        return ""
    }
  }

  return (
    <Card className="backdrop-blur-xl bg-slate-800/30 border-slate-600/30 hover:bg-white/15 transition-all duration-300">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                {lead.first_name} {lead.last_name}
              </h3>
              <Badge
                variant={lead.status === "new" ? "default" : "secondary"}
                className={
                  lead.status === "new"
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                }
              >
                {lead.status}
              </Badge>
              <Badge variant="outline" className={`${getScoreColor(lead.lead_score)}`}>
                {lead.lead_score}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                {lead.source === 'reddit' ? (
                  <div className="flex items-center space-x-2 text-white/80">
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                    <a 
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm truncate text-orange-400 hover:text-orange-300 underline"
                      title="View Reddit post"
                    >
                      {lead.first_name || 'Reddit User'}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-white/80">
                    <Facebook className="h-4 w-4 flex-shrink-0" />
                    <a 
                      href={lead.facebook_profile_url || `https://facebook.com/${lead.facebook_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm truncate text-blue-400 hover:text-blue-300 underline"
                      title={lead.facebook_profile_url ? "Direct profile link" : "Search-based link"}
                    >
                      {lead.facebook_name}
                      {lead.facebook_profile_url && <span className="ml-1 text-green-400">✓</span>}
                    </a>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-white/80">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm truncate">
                    {lead.source === 'reddit' ? 
                      `${lead.town} - r/${lead.group_name}` : 
                      `${lead.town} - ${lead.group_name}`
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {lead.email && (
                  <div className="flex items-center space-x-2 text-white/80">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center space-x-2 text-white/80">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{lead.phone}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-white/80">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">Added: {new Date(lead.date_added).toLocaleDateString()}</span>
                </div>
                {lead.last_contacted && (
                  <div className="flex items-center space-x-2 text-white/80">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">Contact: {new Date(lead.last_contacted).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lead Snippet Section */}
            {lead.notes && lead.notes.includes('AI extracted:') && (
              <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
                <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-cyan-400" />
                  Original Message
                </h4>
                <p className="text-sm text-white/80 italic">
                  "{lead.notes.replace('AI extracted: ', '')}"
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-1 sm:gap-2">
              {lead.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="border-purple-400/50 text-purple-300 text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center gap-2">
            {/* Show different buttons based on lead source */}
            {lead.source === 'reddit' ? (
              /* Reddit "Go to Post" Button */
              <Button
                size="sm"
                onClick={() => {
                  window.open(lead.url, '_blank');
                }}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 flex-1 sm:flex-none"
                title="View original Reddit post"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Go to Post
              </Button>
            ) : (
              /* Facebook Messenger Button */
              <Button
                size="sm"
                onClick={() => {
                  // If we have a direct profile URL, extract the username/ID for messenger
                  if (lead.facebook_profile_url) {
                    const url = lead.facebook_profile_url;
                    if (url.includes('profile.php?id=')) {
                      const idMatch = url.match(/profile\.php\?id=(\d+)/);
                      if (idMatch) {
                        window.open(`https://m.me/${idMatch[1]}`, '_blank');
                        return;
                      }
                    } else {
                      const pathParts = url.split('/');
                      const username = pathParts[pathParts.length - 1];
                      if (username) {
                        window.open(`https://m.me/${username}`, '_blank');
                        return;
                      }
                    }
                  }
                  // Fallback to facebook_name
                  window.open(`https://m.me/${lead.facebook_name}`, '_blank');
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex-1 sm:flex-none"
                title={lead.facebook_profile_url ? "Message via verified profile" : "Message via username"}
              >
                <Facebook className="h-4 w-4 mr-1" />
                Message
                {lead.facebook_profile_url && <span className="ml-1 text-green-400">✓</span>}
              </Button>
            )}

            <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-blue-600 hover:to-cyan-600 flex-1 sm:flex-none"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-slate-700/50 text-slate-100 max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">
                    Contact {lead.first_name} {lead.last_name}
                  </DialogTitle>
                  <DialogDescription className="text-white/70 text-sm">
                    Send a personalized message to this lead
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Contact Method</Label>
                    <Select
                      value={contactType}
                      onValueChange={(value: "email" | "sms" | "facebook") => {
                        setContactType(value)
                        setContactMessage(getDefaultMessage())
                      }}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-slate-100">
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
                        {/* Only show Facebook option for non-Reddit leads */}
                        {lead.source !== 'reddit' && (
                          <SelectItem value="facebook">
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="h-4 w-4" />
                              <span>Facebook</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Message</Label>
                    <Textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="bg-slate-800/50 border-slate-600/50 text-slate-100 min-h-[150px] sm:min-h-[200px] text-sm"
                      placeholder={getDefaultMessage()}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => setContactMessage(getDefaultMessage())}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 order-2 sm:order-1"
                      size="sm"
                    >
                      Use Template
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-green-600 hover:to-emerald-600 flex-1 order-1 sm:order-2"
                      disabled={isSending || !contactMessage.trim()}
                      size="sm"
                    >
                      {isSending ? "Sending..." : "Send Message"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 bg-transparent flex-1 sm:flex-none"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900/95 border-slate-700/50">
                <DropdownMenuItem className="text-white hover:bg-white/10 text-sm">Edit Lead</DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-white/10 text-sm">View History</DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-white/10 text-sm">Mark as Qualified</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AutoContactView({
  leads,
  onContactSent,
}: {
  leads: Lead[]
  onContactSent: (attempt: ContactAttempt) => void
}) {
  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-slate-800/30 border-slate-600/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Bot className="h-5 w-5 text-cyan-400" />
            <span>Auto Contact Center</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/70">
            AI-powered automated outreach to qualified leads. Select leads and contact methods for bulk messaging.
          </p>
          <div className="text-center py-8">
            <p className="text-white/60">Auto Contact functionality is available here</p>
            <p className="text-white/40 text-sm mt-2">
              Features: Bulk contact, personalized messages, scheduling, follow-ups
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ResponsesView({
  leads,
  contactAttempts,
}: {
  leads: Lead[]
  contactAttempts: ContactAttempt[]
}) {
  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-slate-800/30 border-slate-600/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-green-400" />
            <span>Lead Responses & Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/70">
            Track and manage responses from contacted leads. View conversation history and follow-up actions.
          </p>
          <div className="space-y-4">
            {contactAttempts.length > 0 ? (
              contactAttempts.map((attempt) => {
                const lead = leads.find((l) => l.id === attempt.lead_id)
                return (
                  <Card key={attempt.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">
                          {lead?.first_name} {lead?.last_name}
                        </span>
                        <Badge variant="outline" className="border-cyan-400/50 text-cyan-300">
                          {attempt.contact_type}
                        </Badge>
                      </div>
                      <p className="text-white/70 text-sm mb-2">Sent: {new Date(attempt.sent_at).toLocaleString()}</p>
                      <p className="text-white/60 text-sm">{attempt.message_content.substring(0, 100)}...</p>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-white/60">No contact attempts yet</p>
                <p className="text-white/40 text-sm mt-2">Contact attempts will appear here after sending messages</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsView({ isAutoContactEnabled }: { isAutoContactEnabled: boolean }) {
  const [dmTemplate, setDmTemplate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Load current DM template
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/settings/dm-template')
        if (response.ok) {
          const data = await response.json()
          setDmTemplate(data.template || '')
        }
      } catch (error) {
        console.error('Error loading DM template:', error)
        // Set default template
        setDmTemplate(`Hi {{firstName}}! 👋

I saw your post about {{keywords}} and wanted to reach out. I'm a local HVAC professional serving {{town}} and would love to help you with your heating and cooling needs.

We specialize in:
🔧 {{keywords}} installation & repair
❄️ Energy-efficient solutions
⚡ Same-day emergency service
💰 Free consultations & estimates

I'd be happy to provide you with a free consultation to discuss your specific situation. When would be a good time for a quick call?

Best regards,
[Your HVAC Business]
📞 Licensed & Insured`)
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplate()
  }, [])

  const saveDMTemplate = async () => {
    if (!dmTemplate.trim()) {
      setSaveMessage('Template cannot be empty')
      return
    }

    setIsSaving(true)
    setSaveMessage('')

    try {
      const response = await fetch('http://localhost:5000/api/settings/dm-template', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template: dmTemplate }),
      })

      if (response.ok) {
        setSaveMessage('✅ Template saved successfully!')
      } else {
        setSaveMessage('❌ Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      setSaveMessage('❌ Error saving template')
    } finally {
      setIsSaving(false)
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-slate-800/30 border-slate-600/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Settings className="h-5 w-5 text-cyan-400" />
            <span>Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Auto-DM Template</h3>
            <p className="text-white/70 mb-4">
              Customize the message template used for automatic Facebook DMs to new leads.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="dm-template" className="text-white mb-2 block">
                  Message Template
                </Label>
                <p className="text-sm text-white/60 mb-2">
                  Available variables: {`{{firstName}}, {{lastName}}, {{fullName}}, {{town}}, {{groupName}}, {{keywords}}, {{snippet}}`}
                </p>
                
                {isLoading ? (
                  <div className="h-32 bg-slate-700/50 rounded-lg flex items-center justify-center">
                    <span className="text-white/60">Loading template...</span>
                  </div>
                ) : (
                  <Textarea
                    id="dm-template"
                    value={dmTemplate}
                    onChange={(e) => setDmTemplate(e.target.value)}
                    placeholder="Enter your DM template..."
                    className="min-h-[200px] bg-slate-700/50 border-slate-600 text-white placeholder:text-white/40 resize-y"
                  />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <Button 
                  onClick={saveDMTemplate} 
                  disabled={isSaving || isLoading}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                >
                  {isSaving ? 'Saving...' : 'Save Template'}
                </Button>
                
                {saveMessage && (
                  <span className={`text-sm ${saveMessage.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                    {saveMessage}
                  </span>
                )}
              </div>
              
              <div className="text-xs text-white/50 space-y-1">
                <p><strong>Tip:</strong> Use emojis and personalization to make your messages more engaging.</p>
                <p><strong>Note:</strong> Messages are sent automatically when auto-contact is enabled and new leads are found.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Auto-Contact Status</h3>
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
              <div>
                <p className="text-white font-medium">Automatic DM Sending</p>
                <p className="text-white/60 text-sm">
                  {isAutoContactEnabled 
                    ? "✅ Auto-contact is ON - New leads will be messaged automatically" 
                    : "⚠️ Auto-contact is OFF - Toggle the switch in the header to enable"
                  }
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isAutoContactEnabled 
                  ? "bg-green-600/20 text-green-400 border border-green-600/30" 
                  : "bg-orange-600/20 text-orange-400 border border-orange-600/30"
              }`}>
                {isAutoContactEnabled ? "ACTIVE" : "INACTIVE"}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">AI Settings</h3>
            <p className="text-white/70 mb-4">Configure AI lead scoring and enrichment parameters.</p>
            <div className="text-center py-8">
              <p className="text-white/60">AI configuration options will be implemented here</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
            <p className="text-white/70 mb-4">Set up alerts for new leads and responses.</p>
            <div className="text-center py-8">
              <p className="text-white/60">Notification preferences will be implemented here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
