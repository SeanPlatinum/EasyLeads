export type Lead = {
  id: number
  first_name: string
  last_name: string
  facebook_name: string
  facebook_profile_url?: string
  email?: string
  phone?: string
  town: string
  group_name: string
  keywords: string[]
  notes?: string
  status: "new" | "qualified" | "contacted" | "quoted" | "closed" | "lost"
  contact_status: "not_contacted" | "contacted" | "responded" | "no_response"
  date_added: string
  last_contacted?: string
  lead_score: number
  profile_data?: any
  created_at: string
  updated_at: string
  source?: "facebook" | "reddit"
  url?: string
}

export type ContactAttempt = {
  id: number
  lead_id: number
  contact_type: "email" | "sms" | "facebook"
  message_content: string
  sent_at: string
  status: "sent" | "delivered" | "opened" | "replied"
  response_content?: string
  response_received_at?: string
}

export type ContactTemplate = {
  id: number
  name: string
  type: "email" | "sms" | "facebook"
  subject?: string
  content: string
  is_active: boolean
  created_at: string
}

// Mock templates
export const mockTemplates: ContactTemplate[] = [
  {
    id: 1,
    name: "HVAC Email Template",
    type: "email",
    subject: "Professional HVAC Services - Free Consultation",
    content: `Hi {{firstName}},

I noticed your recent post about {{keywords}} in the {{groupName}} group. 

As a local HVAC professional serving {{town}}, I'd love to help you with your heating and cooling needs. We specialize in:

• Heat pump installations and repairs
• Mini-split systems
• AC maintenance and replacement
• Energy-efficient solutions

I'm offering a FREE consultation to discuss your specific needs. Would you be interested in a quick 15-minute call this week?

Best regards,
[Your HVAC Business]
Phone: [Your Phone]
Licensed & Insured`,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "HVAC SMS Template",
    type: "sms",
    content: `Hi {{firstName}}! Saw your post about {{keywords}} in {{groupName}}. Local HVAC pro here - offering free consultation for {{town}} residents. Interested? Reply YES for details!`,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    name: "Facebook Message Template",
    type: "facebook",
    content: `Hi {{firstName}}! I saw your post in {{groupName}} about {{keywords}}. I'm a local HVAC contractor in {{town}} and would love to help. Sending you a PM with some options!`,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
]

// Mock initial leads
export const mockLeads: Lead[] = [
  {
    id: 1,
    first_name: "John",
    last_name: "Smith",
    facebook_name: "john.smith.123",
    email: "john.smith@gmail.com",
    phone: "(555) 123-4567",
    town: "Springfield",
    group_name: "Springfield Community Board",
    keywords: ["heat pump", "hvac"],
    notes: "Looking for heat pump replacement, mentioned budget concerns",
    date_added: "2024-01-15T10:00:00Z",
    status: "new",
    contact_status: "not_contacted",
    lead_score: 85,
    profile_data: {
      scraped: {
        profilePicture: "/placeholder.svg?height=100&width=100",
        recentPosts: ["Looking for a reliable HVAC company in Springfield"],
        friends: 234,
        location: "Springfield",
      },
    },
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    first_name: "Sarah",
    last_name: "Johnson",
    facebook_name: "sarah.j.hvac",
    email: "sarah.johnson@yahoo.com",
    town: "Riverside",
    group_name: "Riverside Homeowners",
    keywords: ["mini split", "ac"],
    notes: "New homeowner, interested in mini split installation",
    date_added: "2024-01-14T14:30:00Z",
    status: "new",
    contact_status: "not_contacted",
    lead_score: 92,
    profile_data: {
      scraped: {
        profilePicture: "/placeholder.svg?height=100&width=100",
        recentPosts: ["Just bought a house, need AC recommendations"],
        friends: 156,
        location: "Riverside",
      },
    },
    created_at: "2024-01-14T14:30:00Z",
    updated_at: "2024-01-14T14:30:00Z",
  },
  {
    id: 3,
    first_name: "Mike",
    last_name: "Davis",
    facebook_name: "mike.davis.home",
    phone: "(555) 987-6543",
    town: "Springfield",
    group_name: "Springfield Buy/Sell/Trade",
    keywords: ["hvac", "repair"],
    notes: "Emergency repair needed, system not working",
    date_added: "2024-01-13T09:15:00Z",
    status: "new",
    contact_status: "not_contacted",
    lead_score: 78,
    profile_data: {
      scraped: {
        profilePicture: "/placeholder.svg?height=100&width=100",
        recentPosts: ["HVAC system died, need help ASAP!"],
        friends: 89,
        location: "Springfield",
      },
    },
    created_at: "2024-01-13T09:15:00Z",
    updated_at: "2024-01-13T09:15:00Z",
  },
]
