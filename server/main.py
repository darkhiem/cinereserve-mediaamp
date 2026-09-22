import asyncio
import json
import uuid
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user
)
from database import db

app = FastAPI(title="Seat Booking API", version="1.0.0")

# CORS setup for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager for real-time broadcasts
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

# Background task for auto-expiring holds
async def expired_holds_sweeper():
    while True:
        try:
            await asyncio.sleep(1.0)
            expired_ids = await db.cleanup_expired_holds()
            if expired_ids:
                seats = await db.get_seats()
                await manager.broadcast({
                    "event": "SEATS_UPDATED",
                    "reason": "HOLD_EXPIRED",
                    "expiredSeatIds": expired_ids,
                    "seats": seats
                })
        except Exception as e:
            print(f"Sweeper error: {e}")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(expired_holds_sweeper())

# Pydantic Schemas
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class HoldSeatsRequest(BaseModel):
    seatIds: List[str]
    holdDurationSeconds: Optional[int] = 300

class CancelHoldRequest(BaseModel):
    seatIds: List[str]

class BookSeatsRequest(BaseModel):
    seatIds: List[str]
    paymentMethod: Optional[str] = "Mock Credit Card"

# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send current seat map immediately on connection
        seats = await db.get_seats()
        await websocket.send_json({"event": "INITIAL_SEATS", "seats": seats})
        while True:
            # Keep socket alive and listen for optional ping/pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# REST Endpoints

@app.post("/api/auth/signup")
async def signup(req: SignupRequest):
    if not req.name or not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Name, email, and password required")

    existing = await db.find_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user_id = f"u_{uuid.uuid4().hex[:8]}"
    hashed_pwd = get_password_hash(req.password)
    user = {
        "id": user_id,
        "name": req.name,
        "email": req.email,
        "password": hashed_pwd
    }
    await db.add_user(user)

    token = create_access_token({"sub": user_id, "name": req.name, "email": req.email})
    return {
        "user": {"id": user_id, "name": req.name, "email": req.email},
        "token": token
    }

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = await db.find_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["id"], "name": user["name"], "email": user["email"]})
    return {
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
        "token": token
    }

@app.get("/api/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "user": {
            "id": user["sub"],
            "name": user["name"],
            "email": user["email"]
        }
    }

@app.get("/api/seats")
async def get_seats():
    seats = await db.get_seats()
    return {"seats": seats}

@app.post("/api/seats/hold")
async def hold_seats(req: HoldSeatsRequest, user: dict = Depends(get_current_user)):
    if not req.seatIds:
        raise HTTPException(status_code=400, detail="At least one seat ID required")

    res = await db.hold_seats_atomic(
        seat_ids=req.seatIds,
        user_id=user["sub"],
        user_name=user["name"],
        hold_duration_seconds=req.holdDurationSeconds or 300
    )

    if not res["success"]:
        raise HTTPException(status_code=409, detail=res)

    # Broadcast seat map update to all clients
    seats = await db.get_seats()
    await manager.broadcast({
        "event": "SEATS_UPDATED",
        "reason": "SEATS_HELD",
        "heldBy": user["sub"],
        "seatIds": req.seatIds,
        "seats": seats
    })

    return res

@app.post("/api/seats/cancel-hold")
async def cancel_hold(req: CancelHoldRequest, user: dict = Depends(get_current_user)):
    released = await db.release_hold_atomic(
        seat_ids=req.seatIds,
        user_id=user["sub"]
    )

    seats = await db.get_seats()
    await manager.broadcast({
        "event": "SEATS_UPDATED",
        "reason": "HOLD_CANCELLED",
        "seatIds": req.seatIds,
        "seats": seats
    })

    return {"releasedCount": released}

@app.post("/api/seats/book")
async def book_seats(req: BookSeatsRequest, user: dict = Depends(get_current_user)):
    if not req.seatIds:
        raise HTTPException(status_code=400, detail="Seat IDs required")

    res = await db.book_seats_atomic(
        seat_ids=req.seatIds,
        user_id=user["sub"],
        user_name=user["name"],
        payment_method=req.paymentMethod or "Mock Card"
    )

    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["error"])

    # Broadcast seat map update
    seats = await db.get_seats()
    await manager.broadcast({
        "event": "SEATS_UPDATED",
        "reason": "SEATS_BOOKED",
        "bookedBy": user["sub"],
        "seatIds": req.seatIds,
        "seats": seats
    })

    return res

@app.get("/api/bookings")
async def get_my_bookings(user: dict = Depends(get_current_user)):
    bookings = await db.get_user_bookings(user["sub"])
    return {"bookings": bookings}

@app.post("/api/seats/reset")
async def reset_seats():
    seats = await db.reset_seats()
    await manager.broadcast({
        "event": "SEATS_UPDATED",
        "reason": "RESET",
        "seats": seats
    })
    return {"message": "All seats reset to AVAILABLE", "seats": seats}
