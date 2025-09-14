-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  facebook_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  town VARCHAR(100),
  group_name VARCHAR(255),
  keywords TEXT[],
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new',
  contact_status VARCHAR(50) DEFAULT 'not_contacted',
  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_contacted TIMESTAMP,
  lead_score INTEGER DEFAULT 0,
  profile_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contact_attempts table
CREATE TABLE IF NOT EXISTS contact_attempts (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  contact_type VARCHAR(50), -- 'email', 'sms', 'facebook'
  message_content TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'replied'
  response_content TEXT,
  response_received_at TIMESTAMP
);

-- Create auto_contact_templates table
CREATE TABLE IF NOT EXISTS auto_contact_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  type VARCHAR(50), -- 'email', 'sms', 'facebook'
  subject VARCHAR(255),
  content TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default templates
INSERT INTO auto_contact_templates (name, type, subject, content) VALUES
('HVAC Email Template', 'email', 'Professional HVAC Services - Free Consultation', 
'Hi {{firstName}},

I noticed your recent post about {{keywords}} in the {{groupName}} group. 

As a local HVAC professional serving {{town}}, I''d love to help you with your heating and cooling needs. We specialize in:

• Heat pump installations and repairs
• Mini-split systems
• AC maintenance and replacement
• Energy-efficient solutions

I''m offering a FREE consultation to discuss your specific needs. Would you be interested in a quick 15-minute call this week?

Best regards,
[Your HVAC Business]
Phone: [Your Phone]
Licensed & Insured'),

('HVAC SMS Template', 'sms', '', 
'Hi {{firstName}}! Saw your post about {{keywords}} in {{groupName}}. Local HVAC pro here - offering free consultation for {{town}} residents. Interested? Reply YES for details!'),

('Facebook Message Template', 'facebook', '', 
'Hi {{firstName}}! I saw your post in {{groupName}} about {{keywords}}. I''m a local HVAC contractor in {{town}} and would love to help. Sending you a PM with some options!');
