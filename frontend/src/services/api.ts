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

// HTTP helper functions
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

// API Functions

export async function createSession(title: string, language: string = 'javascript'): Promise<Session> {
  const response = await apiRequest<Session>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ title, language }),
  });

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
  return apiRequest<Participant[]>(`/sessions/${sessionId}/participants`, {
    method: 'GET',
  });
}

export async function joinSession(sessionId: string, name: string): Promise<Participant> {
  return apiRequest<Participant>(`/sessions/${sessionId}/participants`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
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

export function subscribeToParticipants(
  sessionId: string,
  onMessage: (participants: Participant[]) => void,
  onError?: () => void
): () => void {
  const url = `${BASE_URL}/sessions/${sessionId}/participants/stream`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as Participant[];
      onMessage(data);
    } catch (error) {
      console.error('Failed to parse participants stream', error);
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
    if (onError) onError();
  };

  return () => eventSource.close();
}
