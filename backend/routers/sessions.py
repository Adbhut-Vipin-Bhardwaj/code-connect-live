"""API router for session management endpoints."""

from fastapi import APIRouter, HTTPException, status
from datetime import datetime
import uuid

from models import Session, CreateSessionRequest, UpdateCodeRequest, UpdateLanguageRequest
from config import DEFAULT_CODE, SUPPORTED_LANGUAGES
import database

router = APIRouter(prefix="/v1/sessions", tags=["sessions"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=Session)
def create_session(request: CreateSessionRequest):
    """Create a new coding session."""
    try:
        if request.language not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": f"Unsupported language: {request.language}", "code": 400}
            )
        
        session_id = str(uuid.uuid4())
        session_data = {
            "id": session_id,
            "title": request.title,
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "language": request.language,
            "code": DEFAULT_CODE[request.language]
        }
        
        database.create_session(session_id, session_data)
        return session_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e), "code": 500}
        )


@router.get("/{sessionId}", response_model=Session)
def get_session(sessionId: str):
    """Get session details."""
    session = database.get_session(sessionId)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Session not found", "code": 404}
        )
    return session


@router.put("/{sessionId}")
def update_session_code(sessionId: str, request: UpdateCodeRequest):
    """Update session code."""
    session = database.get_session(sessionId)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Session not found", "code": 404}
        )
    
    database.update_session_code(sessionId, request.code)
    return {"message": "Code updated successfully"}


@router.put("/{sessionId}/language")
def update_session_language(sessionId: str, request: UpdateLanguageRequest):
    """Update session language."""
    session = database.get_session(sessionId)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Session not found", "code": 404}
        )
    
    if request.language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": f"Unsupported language: {request.language}", "code": 400}
        )
    
    new_code = DEFAULT_CODE[request.language]
    database.update_session_language(sessionId, request.language, new_code)
    
    return {"code": new_code}
