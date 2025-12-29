# Code Connect Live

A collaborative coding platform for interviews and pair programming.

## Quick Start (GitHub Codespaces)

### 1. Start the Backend

```bash
cd backend
uv sync
uv run python main.py
```

The backend will run on port 3000.

### 2. Start the Frontend (in a new terminal)

```bash
cd frontend
npm install  # or: bun install
npm run dev  # or: bun dev
```

The frontend will run on port 8080.

### 3. Access the Application

In GitHub Codespaces:
- The frontend will be automatically forwarded to port 8080
- Click the "Ports" tab and open the port 8080 URL
- The frontend will proxy API requests to the backend on port 3000

## Architecture

- **Backend**: FastAPI (Python) - REST API for session management and code execution
- **Frontend**: React + TypeScript + Vite - Real-time collaborative coding interface
- **Database**: In-memory storage (for development)

## Features

- Create and join coding sessions
- Multi-language support (JavaScript, TypeScript, Python, Java, C++)
- Real-time code execution
- Collaborative editing with participant cursors
- Share session links

## API Endpoints

- `POST /v1/sessions` - Create a new session
- `GET /v1/sessions/{id}` - Get session details
- `PUT /v1/sessions/{id}` - Update session code
- `PUT /v1/sessions/{id}/language` - Change programming language
- `POST /v1/execute` - Execute code

## GitHub Codespaces Configuration

The application is configured to work out-of-the-box in GitHub Codespaces:

- **CORS**: Backend allows all origins (configure for production)
- **Proxy**: Frontend Vite server proxies `/api/*` to `localhost:3000`
- **Ports**: Frontend (8080) and Backend (3000) are auto-forwarded

## Development

### Backend
```bash
cd backend
uv add <package>      # Add dependency
uv run python main.py # Run server
```

### Frontend
```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Lint code
```

## Testing

### Backend Integration Tests

The backend has pytest-based integration tests that verify all API endpoints:

```bash
cd backend

# Install dependencies (if not already done)
uv sync

# Make sure the server is running on port 3000
# In another terminal: uv run python main.py

# Run tests with pytest
uv run pytest test_api.py -v

# Or run tests standalone
uv run python test_api.py
```

Tests cover:
- Creating sessions
- Getting session details
- Updating code
- Joining sessions
- Code execution

### Frontend Tests

Run unit and component tests with Vitest:

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Run tests
npm test
```

Tests cover:
- Component rendering and interactions
- API service functions
- User interactions with UI components

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=/api    # API proxy path
```

## Next Steps

- [ ] Implement WebSocket for real-time collaboration
- [ ] Add authentication
- [ ] Persistent database (PostgreSQL/MongoDB)
- [ ] Deploy to production
- [ ] Add more language support
