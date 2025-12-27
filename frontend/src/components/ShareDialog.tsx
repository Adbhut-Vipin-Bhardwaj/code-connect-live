import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Share2, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  sessionId: string;
}

export function ShareDialog({ sessionId }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/interview/${sessionId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share this link with your candidate.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Link className="h-5 w-5 text-primary" />
            Share Interview Link
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Anyone with this link can join the interview session and collaborate in real-time.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2">
          <Input
            value={shareUrl}
            readOnly
            className="border-border bg-muted font-mono text-sm text-foreground"
          />
          <Button
            onClick={copyToClipboard}
            size="icon"
            variant={copied ? 'default' : 'secondary'}
            className={copied ? 'glow-sm' : ''}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="mt-2 rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> All changes are synced in real-time. Participants will see each other's cursors and edits instantly.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
