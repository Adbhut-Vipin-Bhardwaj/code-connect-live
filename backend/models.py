"""Pydantic models for request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional


class CursorPosition(BaseModel):
    """Model for cursor position in the editor."""
    lineNumber: int = Field(ge=1)
    column: int = Field(ge=1)


class Participant(BaseModel):
    """Model for a session participant."""
    id: str
    name: str
    avatar: str
    color: str
    isOnline: bool
    cursor: Optional[CursorPosition] = None
    isTyping: bool = False


class Session(BaseModel):
    """Model for a coding session."""
    id: str
    title: str
    createdAt: str
    language: str
    code: str


class CreateSessionRequest(BaseModel):
    """Request model for creating a new session."""
    title: str
    language: str = "javascript"


class UpdateCodeRequest(BaseModel):
    """Request model for updating session code."""
    code: str


class UpdateLanguageRequest(BaseModel):
    """Request model for updating session language."""
    language: str


class JoinSessionRequest(BaseModel):
    """Request model for joining a session."""
    name: str


class ExecuteCodeRequest(BaseModel):
    """Request model for code execution."""
    code: str
    language: str


class CodeExecutionResult(BaseModel):
    """Model for code execution results."""
    success: bool
    output: str
    error: Optional[str] = None
    executionTime: float


class ErrorResponse(BaseModel):
    """Model for error responses."""
    error: str
    code: int
