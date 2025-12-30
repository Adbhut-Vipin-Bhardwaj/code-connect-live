import Editor, { OnMount } from '@monaco-editor/react';
import { useRef, useEffect } from 'react';
import type { editor } from 'monaco-editor';
import { Participant } from '@/services/api';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  remoteCursors?: Participant[];
}

const languageMap: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
};

export function CodeEditor({ code, language, onChange, readOnly = false, remoteCursors = [] }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  // Update cursor decorations when remoteCursors change
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // Create decorations for each remote cursor
    const newDecorations: editor.IModelDeltaDecoration[] = remoteCursors
      .filter(p => p.cursor && !p.name.includes('You'))
      .map(participant => {
        const { lineNumber, column } = participant.cursor!;
        
        // Cursor line decoration
        const cursorDecoration: editor.IModelDeltaDecoration = {
          range: {
            startLineNumber: lineNumber,
            startColumn: column,
            endLineNumber: lineNumber,
            endColumn: column + 1,
          },
          options: {
            className: `remote-cursor-${participant.id}`,
            beforeContentClassName: `remote-cursor-indicator`,
            hoverMessage: { value: `**${participant.name}**${participant.isTyping ? ' is typing...' : ''}` },
            stickiness: 1,
          },
        };

        return cursorDecoration;
      });

    // Apply decorations
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );

    // Inject dynamic styles for cursor colors
    remoteCursors.forEach(participant => {
      if (!participant.cursor) return;
      
      const styleId = `cursor-style-${participant.id}`;
      let styleEl = document.getElementById(styleId);
      
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      styleEl.textContent = `
        .remote-cursor-${participant.id} {
          background-color: ${participant.color}40;
          border-left: 2px solid ${participant.color};
        }
        .remote-cursor-${participant.id}::after {
          content: '${participant.name.split(' ')[0]}';
          position: absolute;
          top: -18px;
          left: -2px;
          background-color: ${participant.color};
          color: #0f1117;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 3px 3px 3px 0;
          white-space: nowrap;
          font-family: 'Inter', sans-serif;
          z-index: 100;
          pointer-events: none;
        }
        ${participant.isTyping ? `
        .remote-cursor-${participant.id}::before {
          content: '';
          position: absolute;
          top: 0;
          left: -2px;
          width: 2px;
          height: 100%;
          background-color: ${participant.color};
          animation: cursor-blink 0.8s ease-in-out infinite;
        }
        ` : ''}
      `;
    });
  }, [remoteCursors]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-editor-bg">
      <style>{`
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .remote-cursor-indicator {
          position: relative;
        }
      `}</style>
      <Editor
        height="100%"
        language={languageMap[language] || 'javascript'}
        value={code}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          tabSize: 2,
          wordWrap: 'on',
          automaticLayout: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          folding: true,
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
}
