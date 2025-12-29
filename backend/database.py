"""In-memory database for sessions and participants."""

from typing import Dict, List, Any

# In-memory storage (use a real database in production)
sessions: Dict[str, Dict[str, Any]] = {}
participants: Dict[str, List[Dict[str, Any]]] = {}


def get_session(session_id: str) -> Dict[str, Any]:
    """Get a session by ID."""
    return sessions.get(session_id)


def create_session(session_id: str, session_data: Dict[str, Any]) -> None:
    """Create a new session."""
    sessions[session_id] = session_data
    participants[session_id] = []


def update_session_code(session_id: str, code: str) -> None:
    """Update the code for a session."""
    if session_id in sessions:
        sessions[session_id]["code"] = code


def update_session_language(session_id: str, language: str, code: str) -> None:
    """Update the language for a session."""
    if session_id in sessions:
        sessions[session_id]["language"] = language
        sessions[session_id]["code"] = code


def get_participants(session_id: str) -> List[Dict[str, Any]]:
    """Get all participants for a session."""
    return participants.get(session_id, [])


def add_participant(session_id: str, participant_data: Dict[str, Any]) -> None:
    """Add a participant to a session."""
    if session_id not in participants:
        participants[session_id] = []
    participants[session_id].append(participant_data)


def update_participant(session_id: str, participant_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update participant fields like cursor or online status."""
    session_participants = participants.get(session_id, [])
    for participant in session_participants:
        if participant.get("id") == participant_id:
            for key, value in updates.items():
                if value is not None:
                    participant[key] = value
            return participant
    return None


def participant_exists(session_id: str, name: str) -> bool:
    """Check if a participant with the given name exists in the session."""
    session_participants = participants.get(session_id, [])
    return any(p["name"] == name for p in session_participants)
