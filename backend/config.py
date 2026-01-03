"""Configuration and constants for the application."""

# Default code templates for each language
DEFAULT_CODE = {
    "javascript": "// Write your JavaScript code here\nconsole.log('Hello, World!');",
    "python": "# Write your Python code here\nprint('Hello, World!')",
    "typescript": "// Write your TypeScript code here\nconsole.log('Hello, World!');"
}

# Supported programming languages
SUPPORTED_LANGUAGES = ["javascript", "python", "typescript"]

# Execution timeout in seconds
EXECUTION_TIMEOUT = 5

# Session cleanup configuration (seconds)
STALE_NO_PARTICIPANT_TTL = 5 * 60  # remove sessions idle without participants
STALE_INACTIVE_TTL = 20 * 60       # remove sessions with no activity even if participants exist
STALE_SWEEP_INTERVAL = 60          # how often to sweep for stale sessions

# Server configuration
HOST = "0.0.0.0"
PORT = 3000

# CORS configuration
# GitHub Codespaces uses forwarded ports with specific URLs
# Allow all origins for development (configure appropriately for production)
CORS_ORIGINS = ["*"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["*"]
CORS_ALLOW_HEADERS = ["*"]
