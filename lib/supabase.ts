import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Lead = {
  id: number
  first_name: string
  last_name: string
  facebook_name: string
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
