"""API router for code execution endpoint."""

from fastapi import APIRouter, HTTPException, status
import time

from models import ExecuteCodeRequest, CodeExecutionResult
from services.code_executor import execute_code
from config import SUPPORTED_LANGUAGES

router = APIRouter(prefix="/v1", tags=["execute"])


@router.post("/execute", response_model=CodeExecutionResult)
def execute_code_endpoint(request: ExecuteCodeRequest):
    """Execute code and return the result."""
    try:
        if request.language not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": f"Unsupported language: {request.language}", "code": 400}
            )
        
        start_time = time.time()
        result = execute_code(request.code, request.language)
        execution_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        return CodeExecutionResult(
            success=result["success"],
            output=result["output"],
            error=result.get("error"),
            executionTime=execution_time
        )
    except HTTPException:
        raise
    except Exception as e:
        return CodeExecutionResult(
            success=False,
            output="",
            error=str(e),
            executionTime=0
        )
