export interface Fact {
  text: string;
  source: string;
  verified: boolean;
  url?: string;
}

export interface TimelineEvent {
  year: string;
  event: string;
}

export interface NewsItem {
  date: string;
  headline: string;
  publisher: string;
  summary: string;
  url?: string;
}

export interface Place {
  id: string;
  name: string;
  category: string; // e.g. 'History', 'Nature', 'Culture', 'Food', 'Hidden Gems'
  type: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewCount?: number;
  address: string;
  distance: string;
  status: string;
  image: string;
  quickFact: string;
  facts: Fact[];
  about: string;
  history: TimelineEvent[];
  news: NewsItem[];
  source?: string;
  isGrounded?: boolean;
}

export interface SavedPlace {
  id: string;
  userId: string;
  placeId: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  notes: string;
  savedAt: string;
}

export interface Contribution {
  id: string;
  userId: string;
  placeId: string;
  placeName: string;
  type: 'fact' | 'correction' | 'story' | 'tip';
  content: string;
  source: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  placeId: string;
  roleType: string; // "Local Tour Guide", "History Professor", "Architecture Expert", "Business Insider"
  messages: ChatMessage[];
  updatedAt: string;
}
