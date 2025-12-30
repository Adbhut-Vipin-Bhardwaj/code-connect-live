"""API router for code execution endpoint."""

from fastapi import APIRouter, HTTPException, status
import time

from models import ExecuteCodeRequest, CodeExecutionResult
from services.code_executor import execute_code
from config import SUPPORTED_LANGUAGES

router = APIRouter(prefix="/v1", tags=["execute"])


@router.post("/execute", response_model=CodeExecutionResult, status_code=status.HTTP_410_GONE)
def execute_code_endpoint(request: ExecuteCodeRequest):
    """Server-side execution is disabled; code now runs in-browser via WASM."""
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail={
            "error": "Server-side execution is disabled. Run code in the client via WASM runtime.",
            "code": 410,
        },
    )
