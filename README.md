# Code Connect Live

Collaborative coding platform for interviews and pair programming. FastAPI powers the session/participant API, while the React + Vite frontend handles the UI and runs code in-browser via WASM (Pyodide for Python, QuickJS + esbuild-wasm for JS/TS).

## Stack
- FastAPI on Python 3.12+ with in-memory storage for development
- React + TypeScript + Vite UI
- Client-side execution: Pyodide (Python) and QuickJS + esbuild-wasm (JavaScript/TypeScript)
- Dev scripts orchestrated with npm and uv

## Prerequisites
- Node.js 18+ (or Bun)
- Python 3.12+ with `uv` installed (`pip install uv`)
- GitHub Codespaces already includes these in the default image

## Quick Start (Codespaces or local)

**Option 1: Run both services together (recommended)**
```bash
# Install dependencies
npm run backend:install
npm run frontend:install

# Run both frontend and backend concurrently
npm run dev
```
Runs backend on port 3000 and frontend on port 8080 with color-coded logs in one terminal.

**Option 2: Run services separately**

Backend (terminal 1):
```bash
cd backend
uv sync
uv run python main.py  # or: uv run uvicorn main:app --host 0.0.0.0 --port 3000
```

Frontend (terminal 2):
```bash
cd frontend
npm install  # or: bun install
npm run dev  # or: bun dev
```

Access: in Codespaces, open forwarded port 8080; the Vite dev server proxies `/api/*` to `localhost:3000`.

## Project layout
- backend/ — FastAPI app with session and participant routes
- frontend/ — Vite + React SPA with in-browser execution runtime
- openapi.yaml — OpenAPI schema for the backend

## API
- `POST /v1/sessions` — Create a new session
- `GET /v1/sessions/{id}` — Get session details
- `PUT /v1/sessions/{id}` — Update session code
- `PUT /v1/sessions/{id}/language` — Change programming language
- `GET /v1/sessions/{id}/participants` — List participants in a session
- `POST /v1/sessions/{id}/participants` — Join a session
- `POST /v1/execute` — Returns 410 Gone; server-side execution is disabled. Run code in the client via the WASM runtime.

Docs are available when the backend is running at `http://localhost:3000/docs` (Swagger) and `/redoc`.

## Client-side code execution
- Languages: Python, JavaScript, TypeScript
- Tooling: Pyodide, QuickJS, and esbuild-wasm (for TS transpile)
- Rationale: the backend never executes untrusted code; execution happens entirely in the browser.

## Development commands

Backend:
```bash
cd backend
uv add <package>      # Add dependency
uv run python main.py # Run server
```

Frontend:
```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Lint code
```

## Testing

Backend integration tests (backend service should be running on :3000):
```bash
cd backend
uv sync
uv run python main.py  # in a separate terminal
uv run pytest test_api.py -v
# or: uv run python test_api.py
```

Frontend tests (Vitest):
```bash
cd frontend
npm install
npm test
```

## Environment variables

Frontend `.env`:
```
VITE_API_URL=/api    # API proxy path
```

## Next steps
- Implement WebSocket-based real-time collaboration
- Add authentication and authorization
- Replace in-memory storage with a persistent database
- Add production deployment path
- Expand language/runtime support as the in-browser toolchain grows
