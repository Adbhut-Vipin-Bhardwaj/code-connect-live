import { v4 as uuidv4 } from 'uuid';

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || '/api';
const API_VERSION = 'v1';
const BASE_URL = `${API_URL}/${API_VERSION}`;

// Types
export interface Session {
  id: string;
  title: string;
  createdAt: Date | string;
  language: string;
  code: string;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isOnline: boolean;
  cursor?: CursorPosition;
  isTyping?: boolean;
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

// Local storage for participants (until WebSocket implementation)
const sessionParticipants = new Map<string, Participant[]>();

// HTTP helper functions
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.detail?.error || 'API request failed');
  }

  return response.json();
}

// Participant colors for cursor indicators
const participantColors = ['#00d4ff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3'];

// API Functions

export async function createSession(title: string, language: string = 'javascript'): Promise<Session> {
  const response = await apiRequest<Session>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ title, language }),
  });
  
  // Add initial participant (the creator)
  const creator: Participant = {
    id: uuidv4(),
    name: 'You (Host)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=host',
    color: participantColors[3],
    isOnline: true,
  };
  sessionParticipants.set(response.id, [creator]);
  
  return {
    ...response,
    createdAt: new Date(response.createdAt),
  };
}

export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    const session = await apiRequest<Session>(`/sessions/${sessionId}`, {
      method: 'GET',
    });
    
    // Initialize participants if not already set
    if (!sessionParticipants.has(sessionId)) {
      const mockParticipants: Omit<Participant, 'id' | 'isOnline'>[] = [
        { name: 'Alex Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex', color: participantColors[0] },
        { name: 'Sarah Miller', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', color: participantColors[1] },
      ];
      
      const participants: Participant[] = mockParticipants.map(p => ({
        ...p,
        id: uuidv4(),
        isOnline: true,
      }));
      sessionParticipants.set(sessionId, participants);
    }
    
    return {
      ...session,
      createdAt: new Date(session.createdAt),
    };
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}

export async function updateSessionCode(sessionId: string, code: string): Promise<void> {
  await apiRequest(`/sessions/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify({ code }),
  });
}

export async function updateSessionLanguage(sessionId: string, language: string): Promise<string> {
  const response = await apiRequest<{ code: string }>(`/sessions/${sessionId}/language`, {
    method: 'PUT',
    body: JSON.stringify({ language }),
  });
  
  return response.code;
}

export async function getParticipants(sessionId: string): Promise<Participant[]> {
  return sessionParticipants.get(sessionId) || [];
}

export async function joinSession(sessionId: string, name: string): Promise<Participant> {
  const existingParticipants = sessionParticipants.get(sessionId) || [];
  const colorIndex = existingParticipants.length % participantColors.length;
  
  const participant: Participant = {
    id: uuidv4(),
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    color: participantColors[colorIndex],
    isOnline: true,
  };
  
  const participants = sessionParticipants.get(sessionId) || [];
  participants.push(participant);
  sessionParticipants.set(sessionId, participants);
  
  return participant;
}

export async function executeCode(code: string, language: string): Promise<CodeExecutionResult> {
  try {
    const result = await apiRequest<CodeExecutionResult>('/execute', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
    
    return result;
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'An error occurred',
      executionTime: 0,
    };
  }
}

// Real-time simulation helpers (until WebSocket implementation)
export function simulateParticipantCursor(
  sessionId: string, 
  callback: (participant: Participant) => void
): () => void {
  const interval = setInterval(() => {
    const participants = sessionParticipants.get(sessionId) || [];
    const otherParticipants = participants.filter(p => !p.name.includes('You'));
    
    if (otherParticipants.length > 0) {
      const randomParticipant = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
      randomParticipant.cursor = {
        lineNumber: Math.floor(Math.random() * 15) + 1,
        column: Math.floor(Math.random() * 40) + 1,
      };
      randomParticipant.isTyping = Math.random() > 0.3;
      callback({ ...randomParticipant });
    }
  }, 2000);
  
  return () => clearInterval(interval);
}

export function simulateParticipantJoin(
  sessionId: string,
  callback: (participant: Participant) => void
): () => void {
  const mockParticipant = {
    name: 'Jordan Lee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
    color: participantColors[2],
  };
  
  const timeout = setTimeout(() => {
    const newParticipant: Participant = {
      ...mockParticipant,
      id: uuidv4(),
      isOnline: true,
    };
    
    const participants = sessionParticipants.get(sessionId) || [];
    if (!participants.some(p => p.name === newParticipant.name)) {
      participants.push(newParticipant);
      sessionParticipants.set(sessionId, participants);
      callback(newParticipant);
    }
  }, 5000);
  
  return () => clearTimeout(timeout);
}
