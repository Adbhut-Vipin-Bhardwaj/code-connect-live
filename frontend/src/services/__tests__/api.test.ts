import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession, getSession, executeCode } from '../api';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('creates a new session successfully', async () => {
      const mockResponse = {
        id: '123',
        title: 'Test Session',
        language: 'javascript',
        code: '',
        createdAt: '2024-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createSession('Test Session', 'javascript');

      expect(result.id).toBe('123');
      expect(result.title).toBe('Test Session');
      expect(result.language).toBe('javascript');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Test Session', language: 'javascript' }),
        })
      );
    });

    it('throws error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Failed to create session' }),
      });

      await expect(createSession('Test', 'python')).rejects.toThrow();
    });
  });

  describe('getSession', () => {
    it('retrieves a session by ID', async () => {
      const mockSession = {
        id: '456',
        title: 'Existing Session',
        language: 'python',
        code: 'print("Hello")',
        createdAt: '2024-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      });

      const result = await getSession('456');

      expect(result).toBeTruthy();
      expect(result?.id).toBe('456');
      expect(result?.title).toBe('Existing Session');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/456'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('returns null when session not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: async () => ({ error: 'Session not found' }),
      });

      const result = await getSession('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('executeCode', () => {
    it('executes code successfully', async () => {
      const mockResult = {
        success: true,
        output: 'Hello, World!',
        executionTime: 42,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await executeCode('print("Hello, World!")', 'python');

      expect(result.success).toBe(true);
      expect(result.output).toBe('Hello, World!');
      expect(result.executionTime).toBe(42);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/execute'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ code: 'print("Hello, World!")', language: 'python' }),
        })
      );
    });

    it('handles execution errors', async () => {
      const mockError = {
        success: false,
        output: '',
        error: 'SyntaxError: Invalid syntax',
        executionTime: 5,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockError,
      });

      const result = await executeCode('invalid code', 'python');

      expect(result.success).toBe(false);
      expect(result.error).toContain('SyntaxError');
    });
  });
});
