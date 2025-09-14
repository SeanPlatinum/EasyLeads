import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Lead, ContactTemplate, ContactAttempt } from "./types"

export async function generatePersonalizedMessage(lead: Lead, template: ContactTemplate): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
        Personalize this HVAC marketing message template for a specific lead:
        
        Template: ${template.content}
        
        Lead Information:
        - Name: ${lead.first_name} ${lead.last_name}
        - Location: ${lead.town}
        - Facebook Group: ${lead.group_name}
        - Keywords they mentioned: ${lead.keywords.join(", ")}
        - Notes: ${lead.notes || "None"}
        - Lead Score: ${lead.lead_score}/100
        
        Instructions:
        1. Replace template variables like {{firstName}}, {{town}}, {{keywords}}, {{groupName}}
        2. Make it sound natural and personalized
        3. Keep the professional tone but make it feel human
        4. Emphasize relevant services based on their keywords
        5. Keep it concise and actionable
        
        Return only the personalized message, no explanations.
      `,
    })

    return text
  } catch (error) {
    console.error("Message personalization failed:", error)
    // Fallback to simple template replacement
    return template.content
      .replace(/\{\{firstName\}\}/g, lead.first_name)
      .replace(/\{\{lastName\}\}/g, lead.last_name)
      .replace(/\{\{town\}\}/g, lead.town)
      .replace(/\{\{groupName\}\}/g, lead.group_name)
      .replace(/\{\{keywords\}\}/g, lead.keywords.join(", "))
  }
}

export async function sendAutoContact(
  leadId: number,
  contactType: "email" | "sms" | "facebook",
  message: string,
  onContactSent?: (attempt: ContactAttempt) => void,
) {
  try {
    // Simulate sending (in real implementation, integrate with email/SMS services)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Create contact attempt record
    const contactAttempt: ContactAttempt = {
      id: Date.now(),
      lead_id: leadId,
      contact_type: contactType,
      message_content: message,
      sent_at: new Date().toISOString(),
      status: "sent",
    }

    // Call callback to update parent component
    if (onContactSent) {
      onContactSent(contactAttempt)
    }

    return { success: true, contactAttempt }
  } catch (error) {
    console.error("Auto contact failed:", error)
    return { success: false, error }
  }
}
