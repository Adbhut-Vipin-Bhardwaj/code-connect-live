"""API router for session management endpoints."""

import asyncio
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

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
            "code": DEFAULT_CODE[request.language],
            "version": 0,
            "lastClientId": None,
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
    
    current_version = session.get("version", 0)

    if request.version != current_version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "Version conflict",
                "code": 409,
                "codeContent": session.get("code", ""),
                "version": current_version,
            },
        )

    new_version = current_version + 1
    database.update_session_code(sessionId, request.code, new_version, request.clientId)
    return {"version": new_version}


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
    current_version = session.get("version", 0)
    new_version = current_version + 1

    database.update_session_language(sessionId, request.language, new_code, new_version, "server-language-change")
    
    return {"code": new_code, "version": new_version}


@router.get("/{sessionId}/stream")
async def stream_session(sessionId: str):
    """Server-sent events stream for session code/language changes."""
    session = database.get_session(sessionId)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Session not found", "code": 404}
        )

    async def event_generator():
        last_payload = None
        try:
            while True:
                current_session = database.get_session(sessionId)
                if not current_session:
                    break

                payload = json.dumps({
                    "code": current_session.get("code", ""),
                    "language": current_session.get("language", "javascript"),
                    "version": current_session.get("version", 0),
                    "sourceClientId": current_session.get("lastClientId"),
                })

                if payload != last_payload:
                    last_payload = payload
                    yield f"data: {payload}\n\n"

                await asyncio.sleep(1)
        except asyncio.CancelledError:
            return

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
