import { v4 as uuidv4 } from 'uuid';

// Types
export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  language: string;
  code: string;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  cursor?: { line: number; column: number };
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

// Mock data storage
const sessions = new Map<string, Session>();
const sessionParticipants = new Map<string, Participant[]>();

// Simulated latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Default code templates
const defaultCode: Record<string, string> = {
  javascript: `// Welcome to the coding interview!
// Write your solution below

function solution(input) {
  // Your code here
  return input;
}

// Test your solution
console.log(solution("Hello, World!"));
`,
  python: `# Welcome to the coding interview!
# Write your solution below

def solution(input):
    # Your code here
    return input

# Test your solution
print(solution("Hello, World!"))
`,
  typescript: `// Welcome to the coding interview!
// Write your solution below

function solution(input: string): string {
  // Your code here
  return input;
}

// Test your solution
console.log(solution("Hello, World!"));
`,
  java: `// Welcome to the coding interview!
// Write your solution below

public class Solution {
    public static String solution(String input) {
        // Your code here
        return input;
    }
    
    public static void main(String[] args) {
        System.out.println(solution("Hello, World!"));
    }
}
`,
  cpp: `// Welcome to the coding interview!
// Write your solution below

#include <iostream>
#include <string>

std::string solution(std::string input) {
    // Your code here
    return input;
}

int main() {
    std::cout << solution("Hello, World!") << std::endl;
    return 0;
}
`,
};

// Mock participant names and avatars
const mockParticipants: Omit<Participant, 'id' | 'isOnline'>[] = [
  { name: 'Alex Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
  { name: 'Sarah Miller', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
  { name: 'Jordan Lee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan' },
];

// API Functions

export async function createSession(title: string, language: string = 'javascript'): Promise<Session> {
  await delay(300);
  
  const session: Session = {
    id: uuidv4(),
    title,
    createdAt: new Date(),
    language,
    code: defaultCode[language] || defaultCode.javascript,
  };
  
  sessions.set(session.id, session);
  
  // Add initial participant (the creator)
  const creator: Participant = {
    id: uuidv4(),
    name: 'You (Host)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=host',
    isOnline: true,
  };
  sessionParticipants.set(session.id, [creator]);
  
  return session;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  await delay(200);
  
  // Create a mock session if it doesn't exist (simulating joining via link)
  if (!sessions.has(sessionId)) {
    const session: Session = {
      id: sessionId,
      title: 'Interview Session',
      createdAt: new Date(),
      language: 'javascript',
      code: defaultCode.javascript,
    };
    sessions.set(sessionId, session);
    
    // Add some mock participants
    const participants: Participant[] = mockParticipants.slice(0, 2).map(p => ({
      ...p,
      id: uuidv4(),
      isOnline: true,
    }));
    sessionParticipants.set(sessionId, participants);
  }
  
  return sessions.get(sessionId) || null;
}

export async function updateSessionCode(sessionId: string, code: string): Promise<void> {
  await delay(50);
  
  const session = sessions.get(sessionId);
  if (session) {
    session.code = code;
    sessions.set(sessionId, session);
  }
}

export async function updateSessionLanguage(sessionId: string, language: string): Promise<string> {
  await delay(100);
  
  const session = sessions.get(sessionId);
  if (session) {
    session.language = language;
    session.code = defaultCode[language] || defaultCode.javascript;
    sessions.set(sessionId, session);
    return session.code;
  }
  
  return defaultCode[language] || defaultCode.javascript;
}

export async function getParticipants(sessionId: string): Promise<Participant[]> {
  await delay(150);
  return sessionParticipants.get(sessionId) || [];
}

export async function joinSession(sessionId: string, name: string): Promise<Participant> {
  await delay(200);
  
  const participant: Participant = {
    id: uuidv4(),
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    isOnline: true,
  };
  
  const participants = sessionParticipants.get(sessionId) || [];
  participants.push(participant);
  sessionParticipants.set(sessionId, participants);
  
  return participant;
}

export async function executeCode(code: string, language: string): Promise<CodeExecutionResult> {
  await delay(800); // Simulate execution time
  
  try {
    if (language === 'javascript' || language === 'typescript') {
      // Create a sandboxed execution environment
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: any[]) => logs.push(args.map(a => String(a)).join(' ')),
        error: (...args: any[]) => logs.push(`Error: ${args.map(a => String(a)).join(' ')}`),
        warn: (...args: any[]) => logs.push(`Warning: ${args.map(a => String(a)).join(' ')}`),
      };
      
      // Very basic sandboxed eval (for demo purposes)
      const sandboxedCode = `
        (function(console) {
          ${code}
        })
      `;
      
      const fn = eval(sandboxedCode);
      fn(mockConsole);
      
      return {
        success: true,
        output: logs.join('\n') || 'Code executed successfully (no output)',
        executionTime: Math.random() * 100 + 50,
      };
    } else {
      // For other languages, return mock output
      return {
        success: true,
        output: `[${language}] Code executed successfully!\nOutput: Hello, World!`,
        executionTime: Math.random() * 200 + 100,
      };
    }
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'An error occurred',
      executionTime: 0,
    };
  }
}

// Real-time simulation helpers
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
        line: Math.floor(Math.random() * 20) + 1,
        column: Math.floor(Math.random() * 40) + 1,
      };
      callback(randomParticipant);
    }
  }, 2000);
  
  return () => clearInterval(interval);
}

export function simulateParticipantJoin(
  sessionId: string,
  callback: (participant: Participant) => void
): () => void {
  const timeout = setTimeout(() => {
    const unusedParticipant = mockParticipants[2];
    const newParticipant: Participant = {
      ...unusedParticipant,
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
