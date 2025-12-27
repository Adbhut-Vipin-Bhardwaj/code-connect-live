import { CodeExecutionResult } from '@/services/api';
import { Terminal, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

interface OutputPanelProps {
  result: CodeExecutionResult | null;
  isExecuting: boolean;
}

export function OutputPanel({ result, isExecuting }: OutputPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-editor-bg">
      <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-2">
        <Terminal className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Output</span>
        
        {isExecuting && (
          <div className="ml-auto flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Running...</span>
          </div>
        )}
        
        {result && !isExecuting && (
          <div className="ml-auto flex items-center gap-2">
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{result.executionTime.toFixed(0)}ms</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {!result && !isExecuting && (
          <p className="font-mono text-sm text-muted-foreground">
            Click "Run Code" to execute your solution...
          </p>
        )}
        
        {isExecuting && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="font-mono text-sm">Executing code...</span>
          </div>
        )}
        
        {result && !isExecuting && (
          <pre className={`font-mono text-sm whitespace-pre-wrap ${
            result.success ? 'text-foreground' : 'text-destructive'
          }`}>
            {result.error || result.output}
          </pre>
        )}
      </div>
    </div>
  );
}
