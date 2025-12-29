import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OutputPanel } from '../OutputPanel';
import { CodeExecutionResult } from '@/services/api';

describe('OutputPanel', () => {
  it('renders empty state when no result and not executing', () => {
    render(<OutputPanel result={null} isExecuting={false} />);
    
    expect(screen.getByText(/Click "Run Code" to execute/i)).toBeInTheDocument();
  });

  it('displays loading state when executing', () => {
    render(<OutputPanel result={null} isExecuting={true} />);
    
    expect(screen.getByText('Running...')).toBeInTheDocument();
    expect(screen.getByText('Executing code...')).toBeInTheDocument();
  });

  it('displays successful execution result', () => {
    const successResult: CodeExecutionResult = {
      success: true,
      output: 'Hello, World!',
      executionTime: 42,
    };

    render(<OutputPanel result={successResult} isExecuting={false} />);
    
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
    expect(screen.getByText('42ms')).toBeInTheDocument();
  });

  it('displays error result', () => {
    const errorResult: CodeExecutionResult = {
      success: false,
      output: '',
      error: 'SyntaxError: Unexpected token',
      executionTime: 10,
    };

    render(<OutputPanel result={errorResult} isExecuting={false} />);
    
    expect(screen.getByText('SyntaxError: Unexpected token')).toBeInTheDocument();
    expect(screen.getByText('10ms')).toBeInTheDocument();
  });

  it('renders output panel header', () => {
    render(<OutputPanel result={null} isExecuting={false} />);
    
    expect(screen.getByText('Output')).toBeInTheDocument();
  });

  it('shows execution time in milliseconds', () => {
    const result: CodeExecutionResult = {
      success: true,
      output: 'Test output',
      executionTime: 123.456,
    };

    render(<OutputPanel result={result} isExecuting={false} />);
    
    expect(screen.getByText('123ms')).toBeInTheDocument();
  });
});
