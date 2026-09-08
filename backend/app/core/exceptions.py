from fastapi import HTTPException, status

class CoalGovException(HTTPException):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail={"code": code, "message": message})

class AuthenticationRequiredException(CoalGovException):
    def __init__(self, message: str = "Authentication required. Bearer token missing or invalid."):
        super().__init__(code="AUTHENTICATION_REQUIRED", message=message, status_code=status.HTTP_401_UNAUTHORIZED)

class PermissionDeniedException(CoalGovException):
    def __init__(self, message: str = "Permission denied for requested governance action."):
        super().__init__(code="PERMISSION_DENIED", message=message, status_code=status.HTTP_403_FORBIDDEN)

class MineScopeDeniedException(CoalGovException):
    def __init__(self, message: str = "Access denied. Mine scope does not grant access to target mine."):
        super().__init__(code="MINE_SCOPE_DENIED", message=message, status_code=status.HTTP_403_FORBIDDEN)

class InvalidStateTransitionException(CoalGovException):
    def __init__(self, message: str = "Invalid state transition for violation workflow."):
        super().__init__(code="INVALID_STATE_TRANSITION", message=message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

class RecordNotFoundException(CoalGovException):
    def __init__(self, message: str = "Requested governance record not found."):
        super().__init__(code="NOT_FOUND", message=message, status_code=status.HTTP_404_NOT_FOUND)

class DuplicateRecordException(CoalGovException):
    def __init__(self, message: str = "Duplicate record detected. Idempotency rule enforced."):
        super().__init__(code="DUPLICATE_RECORD", message=message, status_code=status.HTTP_409_CONFLICT)
