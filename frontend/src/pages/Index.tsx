import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSelector } from '@/components/LanguageSelector';
import { createSession } from '@/services/api';
import { Code2, Users, Zap, Play, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateSession = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a session title.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const session = await createSession(title.trim(), language);
      toast({
        title: 'Session created!',
        description: 'Redirecting to interview room...',
      });
      navigate(`/interview/${session.id}`);
    } catch {
      toast({
        title: 'Failed to create session',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const features = [
    {
      icon: Code2,
      title: 'Real-time Code Editor',
      description: 'Syntax highlighting for multiple languages with live collaboration.',
    },
    {
      icon: Users,
      title: 'Live Collaboration',
      description: 'See cursors and changes from all participants instantly.',
    },
    {
      icon: Zap,
      title: 'Instant Execution',
      description: 'Run code safely in the browser and see results immediately.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        
        <div className="container relative mx-auto px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Collaborative coding interviews made simple</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Code Together,{' '}
              <span className="gradient-text">Interview Better</span>
            </h1>
            
            <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground md:text-xl">
              A powerful platform for live coding interviews. Create a session, share the link, 
              and collaborate in real-time with syntax highlighting and code execution.
            </p>

            {/* Create Session Card */}
            <Card className="mx-auto max-w-lg animate-fade-in border-border bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-foreground">
                  <Play className="h-5 w-5 text-primary" />
                  Start New Interview
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Create a session and share the link with your candidate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="e.g., Frontend Developer Interview"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                />
                
                <LanguageSelector value={language} onChange={setLanguage} />
                
                <Button
                  onClick={handleCreateSession}
                  disabled={isCreating}
                  variant="hero"
                  size="lg"
                  className="w-full"
                >
                  {isCreating ? (
                    'Creating...'
                  ) : (
                    <>
                      Create Session
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            Everything you need for{' '}
            <span className="text-primary">technical interviews</span>
          </h2>
          
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="animate-fade-in border-border bg-card/50 transition-all duration-300 hover:border-primary/50 hover:bg-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built for seamless technical interviews • Real-time collaboration</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
