"""API router for participant management endpoints."""

import asyncio
import json
import uuid
from typing import List

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

import database
from models import JoinSessionRequest, Participant, UpdateParticipantRequest
from utils import generate_avatar_url, generate_color

router = APIRouter(prefix="/v1/sessions", tags=["participants"])


@router.get("/{sessionId}/participants", response_model=List[Participant])
def get_participants(sessionId: str):
    """Get all participants in a session."""
    session = database.get_session(sessionId)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Session not found", "code": 404}
        )
    
    return database.get_participants(sessionId)


@router.post("/{sessionId}/participants", response_model=Participant)
def join_session(sessionId: str, request: JoinSessionRequest):
    """Join a session as a participant."""
    session = database.get_session(sessionId)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Session not found", "code": 404}
        )
    
    # Check if participant name already exists in this session
    if database.participant_exists(sessionId, request.name):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "Participant with this name already exists", "code": 409}
        )
    
    participant_data = {
        "id": str(uuid.uuid4()),
        "name": request.name,
        "avatar": generate_avatar_url(request.name),
        "color": generate_color(),
        "isOnline": True,
        "cursor": None,
        "isTyping": False
    }
    
    database.add_participant(sessionId, participant_data)
    return participant_data


@router.patch("/{sessionId}/participants/{participantId}", response_model=Participant)
def update_participant(sessionId: str, participantId: str, request: UpdateParticipantRequest):
    """Update participant activity (cursor, typing, online)."""
    session = database.get_session(sessionId)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Session not found", "code": 404}
        )

    participant = database.update_participant(sessionId, participantId, request.dict())
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Participant not found", "code": 404}
        )

    return participant


@router.delete("/{sessionId}/participants/{participantId}", status_code=status.HTTP_204_NO_CONTENT)
def leave_session(sessionId: str, participantId: str):
    """Remove a participant from a session when they leave/close the tab."""
    session = database.get_session(sessionId)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Session not found", "code": 404}
        )

    removed = database.remove_participant(sessionId, participantId)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Participant not found", "code": 404}
        )

    return None


@router.get("/{sessionId}/participants/stream")
async def stream_participants(sessionId: str):
    """Server-sent events stream of participant list for basic real-time updates."""
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
                if not database.get_session(sessionId):
                    break

                participant_list = database.get_participants(sessionId)
                payload = json.dumps(participant_list)
                if payload != last_payload:
                    last_payload = payload
                    yield f"data: {payload}\n\n"
                await asyncio.sleep(2)
        except asyncio.CancelledError:
            # Client disconnected
            return

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
