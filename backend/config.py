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
