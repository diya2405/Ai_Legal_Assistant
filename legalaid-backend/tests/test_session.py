import pytest

@pytest.mark.asyncio
async def test_session_lifecycle(async_client):
    # 1. Create session
    res = await async_client.post("/api/session")
    assert res.status_code == 201
    data = res.json()
    assert "session_id" in data
    assert "legalaid_session" in res.cookies
    
    session_id = data["session_id"]
    
    # 2. Get session
    get_res = await async_client.get("/api/session", cookies=res.cookies)
    assert get_res.status_code == 200
    assert get_res.json()["session_id"] == session_id
