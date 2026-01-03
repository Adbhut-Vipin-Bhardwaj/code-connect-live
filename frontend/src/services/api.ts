import { executeInBrowser } from './wasmExecutor';
import type { CodeExecutionResult } from './types';

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
  version: number;
  lastClientId?: string;
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

type ParticipantUpdate = Partial<
  Pick<Participant, 'cursor' | 'isTyping' | 'isOnline'>
> & { cursor?: CursorPosition };

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
    const err = new Error(error.error || error.detail?.error || 'API request failed') as Error & {
      status?: number;
      data?: unknown;
    };
    err.status = response.status;
    err.data = error;
    throw err;
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

export async function updateSessionCode(
  sessionId: string,
  code: string,
  version: number,
  clientId: string
): Promise<number> {
  const response = await apiRequest<{ version: number }>(`/sessions/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify({ code, version, clientId }),
  });

  return response.version;
}

export async function updateSessionLanguage(sessionId: string, language: string): Promise<{ code: string; version: number }> {
  const response = await apiRequest<{ code: string; version: number }>(`/sessions/${sessionId}/language`, {
    method: 'PUT',
    body: JSON.stringify({ language }),
  });

  return response;
}

export function subscribeToSession(
  sessionId: string,
  onMessage: (payload: { code: string; language: string; version: number; sourceClientId?: string }) => void,
  onError?: () => void
): () => void {
  const url = `${BASE_URL}/sessions/${sessionId}/stream`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as { code: string; language: string; version: number; sourceClientId?: string };
      onMessage(data);
    } catch (error) {
      console.error('Failed to parse session stream', error);
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
    if (onError) onError();
  };

  return () => eventSource.close();
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

export async function updateParticipant(
  sessionId: string,
  participantId: string,
  payload: ParticipantUpdate
): Promise<Participant> {
  return apiRequest<Participant>(`/sessions/${sessionId}/participants/${participantId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function leaveSession(
  sessionId: string,
  participantId: string,
  options?: { keepalive?: boolean }
): Promise<void> {
  const url = `${BASE_URL}/sessions/${sessionId}/participants/${participantId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    keepalive: options?.keepalive,
    headers: { 'Content-Type': 'application/json' },
  });

  // Treat 404 as already gone so cleanup is idempotent
  if (!response.ok && response.status !== 404) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to leave session');
  }
}

export async function executeCode(code: string, language: string): Promise<CodeExecutionResult> {
  return executeInBrowser(code, language);
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

export type { CodeExecutionResult } from './types';
