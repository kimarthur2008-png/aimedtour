export interface Clinic {
  id: string;
  name: string;
  country: string;
  city: string;
  specializations: string[];
  certifications: string[];
  phone: string;
  website?: string;
  logoUrl?: string;
  description: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'consultant';
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  consultantId?: string;
  consultantName?: string;
  topic: string;
  description: string;
  status: 'open' | 'closed';
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
