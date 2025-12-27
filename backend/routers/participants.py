"""API router for participant management endpoints."""

from fastapi import APIRouter, HTTPException, status
from typing import List
import uuid

from models import Participant, JoinSessionRequest
import database
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
