"""In-memory database for sessions and participants."""

import time
from typing import Dict, List, Any

# In-memory storage (use a real database in production)
sessions: Dict[str, Dict[str, Any]] = {}
participants: Dict[str, List[Dict[str, Any]]] = {}


def get_session(session_id: str) -> Dict[str, Any]:
    """Get a session by ID."""
    return sessions.get(session_id)


def _now() -> float:
    return time.time()


def _touch_session(session_id: str, *, participant_activity: bool = False) -> None:
    """Update session activity timestamps."""
    if session_id not in sessions:
        return
    now = _now()
    sessions[session_id]["lastActivity"] = now
    if participant_activity:
        sessions[session_id]["lastParticipantActivity"] = now


def create_session(session_id: str, session_data: Dict[str, Any]) -> None:
    """Create a new session."""
    now = _now()
    sessions[session_id] = {
        **session_data,
        "lastActivity": now,
        "lastParticipantActivity": now,
    }
    participants[session_id] = []


def update_session_code(session_id: str, code: str, version: int, client_id: str) -> None:
    """Update the code, version, and last client for a session."""
    if session_id in sessions:
        sessions[session_id]["code"] = code
        sessions[session_id]["version"] = version
        sessions[session_id]["lastClientId"] = client_id
        _touch_session(session_id)


def update_session_language(session_id: str, language: str, code: str, version: int, client_id: str) -> None:
    """Update the language and code while bumping version and last client."""
    if session_id in sessions:
        sessions[session_id]["language"] = language
        sessions[session_id]["code"] = code
        sessions[session_id]["version"] = version
        sessions[session_id]["lastClientId"] = client_id
        _touch_session(session_id)


def get_participants(session_id: str) -> List[Dict[str, Any]]:
    """Get all participants for a session."""
    return participants.get(session_id, [])


def add_participant(session_id: str, participant_data: Dict[str, Any]) -> None:
    """Add a participant to a session."""
    if session_id not in participants:
        participants[session_id] = []
    participants[session_id].append(participant_data)
    _touch_session(session_id, participant_activity=True)


def update_participant(session_id: str, participant_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update participant fields like cursor or online status."""
    session_participants = participants.get(session_id, [])
    for participant in session_participants:
        if participant.get("id") == participant_id:
            for key, value in updates.items():
                if value is not None:
                    participant[key] = value
            _touch_session(session_id, participant_activity=True)
            return participant
    return None


def remove_participant(session_id: str, participant_id: str) -> bool:
    """Remove a participant from a session."""
    if session_id not in participants:
        return False

    session_participants = participants.get(session_id, [])
    initial_len = len(session_participants)
    participants[session_id] = [p for p in session_participants if p.get("id") != participant_id]
    # Drop empty session entries to avoid stale lists
    if not participants[session_id]:
        participants.pop(session_id, None)
    removed = len(participants.get(session_id, [])) != initial_len
    if removed:
        _touch_session(session_id, participant_activity=True)
    return removed


def delete_session(session_id: str) -> None:
    """Delete a session and its participants."""
    sessions.pop(session_id, None)
    participants.pop(session_id, None)


def participant_exists(session_id: str, name: str) -> bool:
    """Check if a participant with the given name exists in the session."""
    session_participants = participants.get(session_id, [])
    return any(p["name"] == name for p in session_participants)
