"""Main application entry point."""

import asyncio
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import database
from routers import sessions, participants
from config import (
    CORS_ORIGINS,
    CORS_ALLOW_CREDENTIALS,
    CORS_ALLOW_METHODS,
    CORS_ALLOW_HEADERS,
    HOST,
    PORT,
    STALE_INACTIVE_TTL,
    STALE_NO_PARTICIPANT_TTL,
    STALE_SWEEP_INTERVAL,
)

# Initialize FastAPI app
app = FastAPI(
    title="Code Connect Live API",
    description="API for collaborative coding platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=CORS_ALLOW_METHODS,
    allow_headers=CORS_ALLOW_HEADERS,
)

# Include routers
app.include_router(sessions.router)
app.include_router(participants.router)

cleanup_task = None


async def cleanup_stale_sessions():
    """Periodically remove stale sessions based on activity and participants."""
    while True:
        now = time.time()
        stale_session_ids = []

        for session_id, session_data in list(database.sessions.items()):
            last_activity = session_data.get("lastActivity", 0)
            last_participant_activity = session_data.get("lastParticipantActivity", last_activity)

            participant_count = len(database.participants.get(session_id, []))
            no_participants_stale = participant_count == 0 and (now - last_participant_activity) >= STALE_NO_PARTICIPANT_TTL
            inactivity_stale = (now - last_activity) >= STALE_INACTIVE_TTL

            if no_participants_stale or inactivity_stale:
                stale_session_ids.append(session_id)

        for session_id in stale_session_ids:
            database.delete_session(session_id)

        await asyncio.sleep(STALE_SWEEP_INTERVAL)


@app.on_event("startup")
async def start_cleanup_task():
    global cleanup_task
    cleanup_task = asyncio.create_task(cleanup_stale_sessions())


@app.on_event("shutdown")
async def stop_cleanup_task():
    if cleanup_task:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass


@app.get("/")
def read_root():
    """Root endpoint returning API information."""
    return {"message": "Code Connect Live API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)

