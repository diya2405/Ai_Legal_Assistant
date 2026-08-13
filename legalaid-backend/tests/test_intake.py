import pytest

@pytest.mark.asyncio
async def test_intake_creation(async_client):
    payload = {
        "raw_text": "I bought a defective laptop for Rs. 55000 on 15th March. Seller refuses refund or repair.",
    }
    response = await async_client.post("/api/intake", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "intake_id" in data
    assert "session_id" in data
    assert "language" in data
    assert isinstance(data["entities"], list)
    
    # Check that money entity was extracted
    labels = [e["label"] for e in data["entities"]]
    assert "MONEY" in labels or "AMOUNT" in labels
