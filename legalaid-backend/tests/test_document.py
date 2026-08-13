import pytest

@pytest.mark.asyncio
async def test_document_generation_and_download(async_client):
    # 1. Create Intake
    intake_res = await async_client.post("/api/intake", json={
        "raw_text": "Unpaid salary dispute for 3 months amounting to Rs. 75000 from Employer XYZ."
    })
    assert intake_res.status_code == 201
    intake_id = intake_res.json()["intake_id"]

    # 2. Generate Document
    doc_res = await async_client.post(f"/api/intake/{intake_id}/document", json={
        "tone": "formal",
        "complainant_name": "Anita Sharma",
        "opponent_name": "XYZ Tech Ltd"
    })
    assert doc_res.status_code == 201
    doc_data = doc_res.json()
    assert "document_id" in doc_data
    assert "download_url" in doc_data

    # 3. Download Document
    dl_res = await async_client.get(doc_data["download_url"])
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/pdf"
    assert len(dl_res.content) > 1000
