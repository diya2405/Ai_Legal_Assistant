import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(base_url="http://127.0.0.1:8002", timeout=30.0) as client:
        yield client
