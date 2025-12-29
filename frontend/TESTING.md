# Frontend Testing Guide

## Overview

The frontend uses Vitest as the test runner with React Testing Library for component testing.

## Test Structure

```
src/
├── components/
│   └── __tests__/
│       ├── LanguageSelector.test.tsx
│       ├── OutputPanel.test.tsx
│       └── ParticipantsList.test.tsx
├── services/
│   └── __tests__/
│       └── api.test.ts
└── test/
    └── setup.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- LanguageSelector.test.tsx
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

### API Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { myApiFunction } from '../api';

global.fetch = vi.fn();

describe('API Functions', () => {
  it('calls API correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    const result = await myApiFunction();
    expect(result).toEqual({ data: 'test' });
  });
});
```

## Test Coverage

Current test coverage includes:
- ✅ LanguageSelector component
- ✅ OutputPanel component
- ✅ ParticipantsList component
- ✅ API service (createSession, getSession, executeCode)

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **User-centric**: Test from the user's perspective
3. **Isolation**: Each test should be independent
4. **Descriptive names**: Use clear test descriptions
5. **Mock external dependencies**: Use vi.fn() for mocking

## Common Testing Utilities

- `render()`: Render a component
- `screen`: Query rendered elements
- `userEvent`: Simulate user interactions
- `waitFor()`: Wait for async updates
- `vi.fn()`: Create mock functions
- `vi.mock()`: Mock modules
