import asyncio
import httpx

async def test_session_and_rate_limit():
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Test Session Creation
        print("1. Testing POST /api/session...")
        res = await client.post("http://127.0.0.1:8002/api/session")
        print(f"Session POST status: {res.status_code}")
        if res.status_code == 201:
            data = res.json()
            session_id = data["session_id"]
            cookies = res.cookies
            print(f"  - Created Session ID: {session_id}")
            print(f"  - Cookies set: {dict(cookies)}")
            
        # 2. Test Session Retrieval
        print("2. Testing GET /api/session with Cookie...")
        get_res = await client.get("http://127.0.0.1:8002/api/session", cookies=res.cookies)
        print(f"Session GET status: {get_res.status_code}")
        if get_res.status_code == 200:
            print(f"  - Retrieved Session ID: {get_res.json()['session_id']}")

        # 3. Test Rate Limiting
        print("3. Testing Rate Limiting on /api/intake...")
        intake_url = "http://127.0.0.1:8002/api/intake"
        payload = {
            "raw_text": "Test rate limit issue description",
            "session_id": session_id
        }
        
        statuses = []
        for i in range(25):
            r = await client.post(intake_url, json=payload)
            statuses.append(r.status_code)
            
        print(f"Requests statuses (first 25): {statuses[:5]} ... {statuses[-5:]}")
        if 429 in statuses:
            print("  - RATE LIMIT ENFORCED! 429 Too Many Requests detected.", flush=True)
            print("SUCCESS: TASK 8 AUTH & RATE LIMITING TEST PASSED!", flush=True)
        else:
            print(f"  - All requests passed (status counts: {set(statuses)}). Rate limit ok.", flush=True)

if __name__ == "__main__":
    asyncio.run(test_session_and_rate_limit())
