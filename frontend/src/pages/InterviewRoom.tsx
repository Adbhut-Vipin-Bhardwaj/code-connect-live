import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CodeEditor } from '@/components/CodeEditor';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ParticipantsList } from '@/components/ParticipantsList';
import { ShareDialog } from '@/components/ShareDialog';
import { OutputPanel } from '@/components/OutputPanel';
import { Button } from '@/components/ui/button';
import {
  getSession,
  updateSessionCode,
  updateSessionLanguage,
  getParticipants,
  joinSession,
  executeCode,
  subscribeToParticipants,
  Session,
  Participant,
  CodeExecutionResult,
} from '@/services/api';
import { Play, ArrowLeft, Code2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InterviewRoom = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        const [sessionData, participantsData] = await Promise.all([
          getSession(sessionId),
          getParticipants(sessionId),
        ]);

        if (sessionData) {
          setSession(sessionData);
          setCode(sessionData.code);
          setLanguage(sessionData.language);
          setParticipants(participantsData);
        } else {
          toast({
            title: 'Session not found',
            description: 'Redirecting to home...',
            variant: 'destructive',
          });
          navigate('/');
        }
      } catch {
        toast({
          title: 'Failed to load session',
          description: 'Please try again.',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [sessionId, navigate, toast]);

  // Real-time participant updates via server-sent events
  useEffect(() => {
    if (!sessionId) return;

    const cleanup = subscribeToParticipants(
      sessionId,
      (liveParticipants) => setParticipants(liveParticipants),
      () => toast({ title: 'Connection lost', description: 'Reconnecting to participants stream.', variant: 'destructive' })
    );

    return cleanup;
  }, [sessionId, toast]);

  const handleCodeChange = useCallback(
    async (newCode: string) => {
      setCode(newCode);
      if (sessionId) {
        await updateSessionCode(sessionId, newCode);
      }
    },
    [sessionId]
  );

  // Ensure current visitor is registered as a participant for this session
  useEffect(() => {
    if (!sessionId) return;

    const storageKey = `ccl-participant-${sessionId}`;
    let participantName = localStorage.getItem(storageKey);

    if (!participantName) {
      participantName = `Guest-${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem(storageKey, participantName);
    }

    joinSession(sessionId, participantName).catch((error) => {
      // Ignore conflict errors when the participant already exists
      if (error instanceof Error && error.message.includes('already exists')) return;
      console.error('Failed to join session', error);
    });
  }, [sessionId]);

  const handleLanguageChange = useCallback(
    async (newLanguage: string) => {
      setLanguage(newLanguage);
      if (sessionId) {
        const newCode = await updateSessionLanguage(sessionId, newLanguage);
        setCode(newCode);
        setExecutionResult(null);
      }
    },
    [sessionId]
  );

  const handleRunCode = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const result = await executeCode(code, language);
      setExecutionResult(result);

      if (result.success) {
        toast({
          title: 'Code executed successfully',
          description: `Completed in ${result.executionTime.toFixed(0)}ms`,
        });
      } else {
        toast({
          title: 'Execution error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Failed to execute code',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading interview session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-foreground">
              {session?.title || 'Interview Session'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ParticipantsList participants={participants} />
          {sessionId && <ShareDialog sessionId={sessionId} />}
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <LanguageSelector value={language} onChange={handleLanguageChange} />
        
        <Button
          onClick={handleRunCode}
          disabled={isExecuting}
          variant="glow"
          size="sm"
          className="gap-2"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Code
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 p-4">
          <CodeEditor
            code={code}
            language={language}
            onChange={handleCodeChange}
            remoteCursors={participants}
          />
        </div>

        {/* Output Panel */}
        <div className="w-[400px] border-l border-border p-4">
          <OutputPanel result={executionResult} isExecuting={isExecuting} />
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
