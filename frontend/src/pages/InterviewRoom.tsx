import { useState, useEffect, useCallback, useRef } from 'react';
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
  updateParticipant,
  executeCode,
  subscribeToSession,
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
  const [version, setVersion] = useState(0);
  const codeUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLocalPendingRef = useRef(false);
  const versionRef = useRef(0);
  const clientIdRef = useRef<string>('');
  const latestCursorRef = useRef<{ lineNumber: number; column: number } | null>(null);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);

  // Stable client id per session for echo suppression
  useEffect(() => {
    if (!sessionId) return;
    const storageKey = `ccl-client-${sessionId}`;
    const existing = sessionStorage.getItem(storageKey);
    if (existing) {
      clientIdRef.current = existing;
      return;
    }
    const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    clientIdRef.current = generated;
    sessionStorage.setItem(storageKey, generated);
  }, [sessionId]);

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
          setVersion(sessionData.version ?? 0);
          versionRef.current = sessionData.version ?? 0;
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
    (newCode: string) => {
      setCode(newCode);
      hasLocalPendingRef.current = true;

      if (!sessionId) return;

      if (codeUpdateTimer.current) {
        clearTimeout(codeUpdateTimer.current);
      }

      codeUpdateTimer.current = setTimeout(() => {
        const baseVersion = versionRef.current;

        updateSessionCode(sessionId, newCode, baseVersion, clientIdRef.current)
          .then((nextVersion) => {
            versionRef.current = nextVersion;
            setVersion(nextVersion);
          })
          .catch((error: unknown) => {
            const err = error as { status?: number; data?: any; message?: string };
            if (err.status === 409 && err.data) {
              const conflictVersion = err.data.version ?? baseVersion;
              const conflictCode = err.data.codeContent ?? newCode;
              versionRef.current = conflictVersion;
              setVersion(conflictVersion);
              setCode(conflictCode);
              toast({
                title: 'Update conflict',
                description: 'Your editor caught up to the latest version.',
              });
            } else {
              console.error('Failed to sync code', error);
              toast({ title: 'Sync issue', description: 'Unable to save code changes.', variant: 'destructive' });
            }
          })
          .finally(() => {
            hasLocalPendingRef.current = false;
          });
      }, 400);
    },
    [sessionId, toast]
  );

  // Stream code/language changes from server for live updates
  useEffect(() => {
    if (!sessionId) return;

    const cleanup = subscribeToSession(
      sessionId,
      ({ code: incomingCode, language: incomingLanguage, version: incomingVersion = 0, sourceClientId }) => {
        const currentVersion = versionRef.current;

        // Ignore echoes from this client but still advance version if needed
        if (sourceClientId && sourceClientId === clientIdRef.current) {
          if (incomingVersion > currentVersion) {
            versionRef.current = incomingVersion;
            setVersion(incomingVersion);
          }
          return;
        }

        // Skip stale snapshots
        if (incomingVersion <= currentVersion) return;

        if (incomingCode !== undefined) {
          setCode((prev) => (incomingCode !== prev ? incomingCode : prev));
        }

        setLanguage((prev) => (incomingLanguage && incomingLanguage !== prev ? incomingLanguage : prev));

        versionRef.current = incomingVersion;
        setVersion(incomingVersion);
      },
      () =>
        toast({
          title: 'Live updates lost',
          description: 'Reconnecting to session updates.',
          variant: 'destructive',
        })
    );

    return cleanup;
  }, [sessionId, toast]);

  const handleCursorChange = useCallback(
    (position: { lineNumber: number; column: number }) => {
      if (!sessionId || !currentParticipantId) return;

      latestCursorRef.current = position;

      setParticipants((prev) =>
        prev.map((participant) =>
          participant.id === currentParticipantId ? { ...participant, cursor: position } : participant
        )
      );

      if (cursorUpdateTimer.current) {
        clearTimeout(cursorUpdateTimer.current);
      }

      cursorUpdateTimer.current = setTimeout(() => {
        if (!latestCursorRef.current) return;
        updateParticipant(sessionId, currentParticipantId, {
          cursor: latestCursorRef.current,
          isOnline: true,
        }).catch((error) => {
          console.error('Failed to update cursor', error);
        });
        cursorUpdateTimer.current = null;
      }, 150);
    },
    [sessionId, currentParticipantId]
  );

  // Cleanup pending code sync timer on unmount
  useEffect(() => {
    return () => {
      if (codeUpdateTimer.current) {
        clearTimeout(codeUpdateTimer.current);
      }
      if (cursorUpdateTimer.current) {
        clearTimeout(cursorUpdateTimer.current);
      }
    };
  }, []);

  // Ensure current visitor is registered as a participant for this session
  useEffect(() => {
    if (!sessionId) return;

    const storageKey = `ccl-participant-${sessionId}`;
    const storedValue = sessionStorage.getItem(storageKey);
    let participantName: string | null = null;
    let participantId: string | null = null;

    if (storedValue) {
      try {
        const parsed = JSON.parse(storedValue) as { id?: string; name?: string };
        participantName = parsed.name || null;
        participantId = parsed.id || null;
      } catch {
        participantName = storedValue;
      }
    }

    if (!participantName) {
      participantName = `Guest-${Math.random().toString(36).slice(2, 7)}`;
      sessionStorage.setItem(storageKey, JSON.stringify({ name: participantName }));
    }

    if (participantId) {
      setCurrentParticipantId(participantId);
    }

    const ensureParticipant = async () => {
      try {
        const participant = await joinSession(sessionId, participantName!);
        setCurrentParticipantId(participant.id);
        sessionStorage.setItem(storageKey, JSON.stringify({ id: participant.id, name: participant.name }));
        setParticipants((prev) => {
          const alreadyPresent = prev.some((p) => p.id === participant.id);
          return alreadyPresent ? prev : [...prev, participant];
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('already exists')) {
          const existingList = await getParticipants(sessionId);
          setParticipants(existingList);
          const existing = existingList.find((p) => p.name === participantName);
          if (existing) {
            setCurrentParticipantId(existing.id);
            sessionStorage.setItem(storageKey, JSON.stringify({ id: existing.id, name: existing.name }));
          }
        } else {
          console.error('Failed to join session', error);
        }
      }
    };

    ensureParticipant();
  }, [sessionId]);

  const handleLanguageChange = useCallback(
    async (newLanguage: string) => {
      setLanguage(newLanguage);
      if (sessionId) {
        try {
          const { code: newCode, version: nextVersion } = await updateSessionLanguage(sessionId, newLanguage);
          setCode(newCode);
          setExecutionResult(null);
          versionRef.current = nextVersion;
          setVersion(nextVersion);
        } catch (error) {
          console.error('Failed to change language', error);
          toast({ title: 'Language sync issue', description: 'Unable to switch language right now.', variant: 'destructive' });
        }
      }
    },
    [sessionId, toast]
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
            onCursorChange={handleCursorChange}
            remoteCursors={participants.filter((p) => p.id !== currentParticipantId)}
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
