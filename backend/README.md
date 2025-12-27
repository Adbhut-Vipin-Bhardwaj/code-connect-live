# Code Connect Live Backend API

FastAPI backend for the Code Connect Live collaborative coding platform.

## Features

- ✅ Create and manage coding sessions
- ✅ Multi-language support (Python, JavaScript, TypeScript, Java, C++)
- ✅ Code execution engine
- ✅ Participant management
- ✅ RESTful API endpoints
- ✅ CORS enabled for cross-origin requests
- ✅ OpenAPI/Swagger documentation
- ✅ Modular architecture for maintainability

## Project Structure

```
backend/
├── main.py                    # Application entry point
├── config.py                  # Configuration and constants
├── models.py                  # Pydantic models
├── database.py                # In-memory data storage
├── utils.py                   # Utility functions
├── routers/                   # API route handlers
│   ├── sessions.py           # Session management endpoints
│   ├── participants.py       # Participant endpoints
│   └── execute.py            # Code execution endpoint
├── services/                  # Business logic
│   └── code_executor.py      # Code execution service
├── test_api.py               # API test script
└── start.sh                  # Startup script
```

## Installation

Install dependencies using `uv`:

```bash
uv sync
```

## Running the Server

Start the development server:

```bash
uv run python main.py
```

Or using uvicorn directly:

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 3000 --reload
```

Or use the startup script:

```bash
chmod +x start.sh
./start.sh
```

The API will be available at `http://localhost:3000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3000/docs`
- ReDoc: `http://localhost:3000/redoc`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

## API Endpoints

### Sessions

- `POST /v1/sessions` - Create a new coding session
- `GET /v1/sessions/{sessionId}` - Get session details
- `PUT /v1/sessions/{sessionId}` - Update session code
- `PUT /v1/sessions/{sessionId}/language` - Update session language

### Participants

- `GET /v1/sessions/{sessionId}/participants` - Get all participants in a session
- `POST /v1/sessions/{sessionId}/participants` - Join a session as a participant

### Code Execution

- `POST /v1/execute` - Execute code in supported languages

## Supported Languages

- Python
- JavaScript (requires Node.js)
- TypeScript (requires ts-node)
- Java (requires JDK)
- C++ (requires g++)

## Example Usage

### Create a Session

```bash
curl -X POST http://localhost:3000/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "My Coding Session", "language": "python"}'
```

### Execute Code

```bash
curl -X POST http://localhost:3000/v1/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello, World!\")", "language": "python"}'
```

### Join a Session

```bash
curl -X POST http://localhost:3000/v1/sessions/{sessionId}/participants \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe"}'
```

## Testing

Run the test script:

```bash
# Start the server first
uv run python main.py &

# Run tests (requires requests library)
uv add requests
uv run python test_api.py
```

## Production Deployment

For production, consider:

1. Using a production-grade ASGI server (uvicorn with multiple workers)
2. Setting up proper CORS origins instead of allowing all
3. Adding authentication/authorization
4. Using a persistent database instead of in-memory storage
5. Implementing rate limiting
6. Adding logging and monitoring
7. Using environment variables for configuration

## Environment Variables

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)

## Architecture

The backend uses a modular architecture:

### Core Components

- **main.py** - FastAPI application initialization and middleware setup
- **config.py** - Centralized configuration and constants
- **models.py** - Pydantic models for data validation
- **database.py** - In-memory storage (replace with real DB in production)
- **utils.py** - Helper functions

### Routers

- **sessions.py** - Session CRUD operations
- **participants.py** - Participant management
- **execute.py** - Code execution endpoint

### Services

- **code_executor.py** - Code execution logic for all supported languages

### Technologies

- **FastAPI** - Modern, fast web framework
- **Pydantic** - Data validation using Python type annotations
- **Uvicorn** - ASGI server for running the application
- **Subprocess** - For executing code in different languages

## Security Considerations

⚠️ **Warning**: The code execution feature runs untrusted code. In production:
- Implement proper sandboxing (Docker containers, VMs)
- Add resource limits (CPU, memory, time)
- Validate and sanitize all inputs
- Implement rate limiting
- Use proper authentication and authorization

## License

MIT
