"""
File: server/test_race_condition.py
Description:
    Automated Concurrency & Race Condition Validation Test Script.
    - Creates 10 distinct authenticated user sessions via API.
    - Uses ThreadPoolExecutor to fire 10 concurrent requests to lock the exact same seat (A1) at the same millisecond.
    - Asserts that exactly 1 request receives HTTP 200 (Success) and the remaining 9 receive HTTP 409 (Conflict).
"""

import requests
import concurrent.futures
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_test():
    print("==========================================")
    print("   RACE CONDITION CONCURRENCY TEST        ")
    print("==========================================")

    # 1. Reset seats first
    try:
        r = requests.post(f"{BASE_URL}/api/seats/reset")
        print(f"Reset seats API status: {r.status_code}")
    except Exception as e:
        print(f"Error connecting to server at {BASE_URL}: {e}")
        print("Make sure the FastAPI server is running (`python -m uvicorn main:app --port 8000`)!")
        sys.exit(1)

    # 2. Create 10 unique dummy user accounts
    run_id = int(time.time())
    users = []
    for i in range(10):
        email = f"racer_{run_id}_{i}@test.com"
        name = f"Racer {i}"
        password = "password123"
        signup_res = requests.post(f"{BASE_URL}/api/auth/signup", json={"name": name, "email": email, "password": password})
        if signup_res.status_code == 200:
            token = signup_res.json()["token"]
        else:
            print(f"Signup failed for {email}: {signup_res.status_code} {signup_res.text}")
            sys.exit(1)
        users.append({"name": name, "email": email, "token": token})

    print(f"Successfully created {len(users)} distinct user sessions.\n")

    # Target seat to hold concurrently
    target_seat = "A1"
    print(f"-> Launching 10 SIMULTANEOUS threads attempting to hold seat '{target_seat}'...\n")

    def try_hold_seat(user):
        headers = {"Authorization": f"Bearer {user['token']}"}
        payload = {"seatIds": [target_seat], "holdDurationSeconds": 60}
        resp = requests.post(f"{BASE_URL}/api/seats/hold", json=payload, headers=headers)
        return user["name"], resp.status_code, resp.json()

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(try_hold_seat, u) for u in users]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    successes = [r for r in results if r[1] == 200]
    conflicts = [r for r in results if r[1] == 409]

    print("--- RESULTS ---")
    for name, status_code, data in results:
        status_msg = "[SUCCESS] (200 - Seat Reserved)" if status_code == 200 else f"[CONFLICT] ({status_code} - Locked by another user)"
        print(f"User: {name:<10} | Response: {status_msg}")

    print("\n------------------------------------------")
    print(f"Total Successful Holds: {len(successes)} (Expected: 1)")
    print(f"Total Blocked Conflicts: {len(conflicts)} (Expected: 9)")
    print("------------------------------------------")

    if len(successes) == 1 and len(conflicts) == 9:
        print(">>> RACE CONDITION TEST PASSED PERFECTLY! Atomic asyncio.Lock prevents double booking! <<<")
    else:
        print(">>> RACE CONDITION TEST FAILED! Check atomic lock implementation. <<<")

if __name__ == "__main__":
    run_test()
