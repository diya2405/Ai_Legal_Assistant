import logging
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request
from app.config import settings

logger = logging.getLogger(__name__)


def get_session_or_ip_key(request: Request) -> str:
    """
    Rate limiting key function: uses X-Session-ID header or HTTP cookie if present,
    falling back to client IP address.
    """
    session_id = request.headers.get("X-Session-ID") or request.cookies.get("legalaid_session")
    if session_id:
        return f"session:{session_id}"
    return get_remote_address(request)


# Initialize SlowAPI Limiter
limiter = Limiter(
    key_func=get_session_or_ip_key,
    default_limits=[settings.RATE_LIMIT]
)
