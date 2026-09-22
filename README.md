# 🎟️ CineReserve - Real-Time Full-Stack Seat Booking System

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**CineReserve** is a full-stack cinema seat reservation platform built to handle **high-concurrency seat locking** with zero double-booking risk. It features **FastAPI** with thread-safe `asyncio.Lock()`, bidirectional **WebSockets** for real-time seat synchronization across multiple browser clients, and a dark-mode **React** frontend.

---

## 🌟 Key Highlights

- 🔒 **Atomic Concurrency Protection**: Zero double-booking guarantee via FastAPI's `asyncio.Lock()`.
- ⚡ **Real-Time Live Map Synchronization**: Instant seat status broadcast (🟢 Available, 🟡 Held, 🔴 Booked) to all active users via WebSockets.
- ⏱️ **Auto-Expiring Holds**: Unpaid seats automatically release back to the public pool after 5 minutes via a 1-second background sweeper.
- 🎟️ **Interactive Cinema Hall**: VIP ($25) and Standard ($15) tiers, visual screen curve, and live state indicators.
- 💳 **Mock Checkout Flow**: Time-sensitive checkout modal with countdown alerts and payment simulation.
- 🎊 **Digital Ticket Passes**: Verified booking passes with custom reference IDs (`BK-XXXXXX`) and celebration confetti.
- 🔑 **JWT Authentication**: Secure user registration, password hashing (`bcrypt`), and instant demo one-click logins.

---

## 🏛️ Architecture Overview

```
 ┌────────────────────────────────────────────────────────┐
 │                   React + Vite Frontend                │
 │  - WebSocket Client (Auto-reconnecting live sync)     │
 │  - Interactive Seat Grid with Multi-tier Pricing       │
 │  - Dynamic Floating Action Bar                         │
 │  - Live Hold Countdown Timer Modal                     │
 │  - Digital Scannable Ticket Pass                       │
 └───────────────────────────┬────────────────────────────┘
                             │ REST API + WebSockets (/ws)
 ┌───────────────────────────▼────────────────────────────┐
 │                  Python FastAPI Backend                │
 │  - Atomic Locking Engine (`asyncio.Lock`)              │
 │  - JWT Auth Middleware (PyJWT + bcrypt)                │
 │  - Expired Hold Background Sweeper Task                │
 │  - Persistent JSON / File Storage (`data.json`)        │
 └────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database & Entity Schema

The application uses a persistent data store with structured JSON / relational entity schemas:

### 1. `seats` Collection / Table
Represents each seat in the theater hall with live lock state and pricing tiers.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String (PK)` | Unique seat code (e.g. `A1`, `B4`, `F10`) |
| `row` | `String` | Row identifier (`A` through `F`) |
| `number` | `Integer` | Seat column number (1–10) |
| `tier` | `String` | `VIP` ($25.00) or `Standard` ($15.00) |
| `price` | `Float` | Seat unit price |
| `status` | `Enum` | `AVAILABLE`, `HOLD`, `BOOKED` |
| `heldBy` | `String (FK)` | User ID currently holding the seat (Nullable) |
| `heldByName` | `String` | Display name of the user holding the seat (Nullable) |
| `holdExpiresAt` | `Integer (Unix ms)` | Epoch timestamp when the 5-minute hold expires (Nullable) |
| `bookedBy` | `String (FK)` | User ID who finalized the purchase (Nullable) |
| `bookedByName`| `String` | Name of the verified ticket holder (Nullable) |
| `bookingRef` | `String (FK)` | Confirmed booking reference ID (e.g. `BK-9428F1`) |

```json
{
  "id": "A1",
  "row": "A",
  "number": 1,
  "tier": "VIP",
  "price": 25.0,
  "status": "HOLD",
  "heldBy": "u_94bc31a2",
  "heldByName": "Alice Parker",
  "holdExpiresAt": 1774343100000,
  "bookedBy": null,
  "bookedByName": null,
  "bookingRef": null
}
```

---

### 2. `users` Collection / Table
Stores registered users with hashed credentials.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String (PK)` | Unique user identifier (e.g. `u_94bc31a2`) |
| `name` | `String` | Full name of the user |
| `email` | `String (Unique)` | User email address (case-insensitive) |
| `password` | `String` | Salted bcrypt password hash |

```json
{
  "id": "u_94bc31a2",
  "name": "Alice Parker",
  "email": "alice@example.com",
  "password": "$2b$12$KIXe8XqL1y..."
}
```

---

### 3. `bookings` Collection / Table
Stores completed transactions and issued digital ticket passes.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String (PK)` | Unique transaction ID (e.g. `b_1774342800123`) |
| `bookingRef` | `String (Unique)` | Alphanumeric booking reference (e.g. `BK-7B29F4`) |
| `userId` | `String (FK)` | ID of the purchasing user |
| `userName` | `String` | Name of the purchasing user |
| `seatIds` | `Array[String]` | Array of reserved seat codes (e.g. `["A1", "A2"]`) |
| `seats` | `Array[Object]` | Detailed seat objects at time of purchase |
| `totalPrice` | `Float` | Total transaction amount paid |
| `paymentMethod` | `String` | Mock payment method (e.g. `Visa •••• 4242`) |
| `status` | `Enum` | `CONFIRMED`, `CANCELLED` |
| `createdAt` | `ISO 8601 Timestamp` | Date and time booking was confirmed |

```json
{
  "id": "b_1774342800123",
  "bookingRef": "BK-7B29F4",
  "userId": "u_94bc31a2",
  "userName": "Alice Parker",
  "seatIds": ["A1", "A2"],
  "seats": [
    {"id": "A1", "row": "A", "number": 1, "tier": "VIP", "price": 25.0},
    {"id": "A2", "row": "A", "number": 2, "tier": "VIP", "price": 25.0}
  ],
  "totalPrice": 50.0,
  "paymentMethod": "Visa •••• 4242",
  "status": "CONFIRMED",
  "createdAt": "2026-09-22T09:00:00Z"
}
```

---

### 🔄 Seat State Lifecycle Machine

```
              ┌───────────────────────────┐
              │         AVAILABLE         │
              └─────────────┬─────────────┘
                            │ User clicks "Lock & Checkout"
                            ▼
              ┌───────────────────────────┐
       ┌─────►│       HOLD (5 mins)       │◄────┐
       │      └───────┬───────────┬───────┘     │
Timer  │              │           │             │
Expires│   Payment    │           │ User        │
       │   Success    │           │ Cancels     │
       │              ▼           ▼             │
       │      ┌──────────────┐    │             │
       │      │    BOOKED    │    └─────────────┘
       │      └──────────────┘
       └──────────────┘
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v18+` or `v20+` / `v22+`
- **Python**: `3.10+` / `3.12+` (or Conda)

### 2. Backend Setup
```bash
# Clone the repository
git clone <repo_url>
cd mediaamp/server

# Create and activate environment (Conda example)
conda create -n seat_booking python=3.12 -y
conda activate seat_booking

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Swagger Documentation: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
# Open a new terminal
cd mediaamp/client

# Install dependencies
npm install

# Start the development server
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 Concurrency / Race Condition Verification

To verify that multiple users cannot reserve the exact same seat simultaneously:

```bash
conda activate seat_booking
cd server
python test_race_condition.py
```

### Test Output:
```text
==========================================
   RACE CONDITION CONCURRENCY TEST        
==========================================
Reset seats API status: 200
Successfully created 10 distinct user sessions.

-> Launching 10 SIMULTANEOUS threads attempting to hold seat 'A1'...

--- RESULTS ---
User: Racer 0    | Response: [SUCCESS] (200 - Seat Reserved)
User: Racer 2    | Response: [CONFLICT] (409 - Locked by another user)
User: Racer 1    | Response: [CONFLICT] (409 - Locked by another user)
User: Racer 3    | Response: [CONFLICT] (409 - Locked by another user)
User: Racer 4    | Response: [CONFLICT] (409 - Locked by another user)
User: Racer 5    | Response: [CONFLICT] (409 - Locked by another user)
User: Racer 6    | Response: [CONFLICT] (409 - Locked by another user)
User: Racer 7    | Response: [CONFLICT] (409 - Locked by another user)
User: Racer 8    | Response: [CONFLICT] (409 - Locked by another user)
User: Racer 9    | Response: [CONFLICT] (409 - Locked by another user)

------------------------------------------
Total Successful Holds: 1 (Expected: 1)
Total Blocked Conflicts: 9 (Expected: 9)
------------------------------------------
>>> RACE CONDITION TEST PASSED PERFECTLY! Atomic asyncio.Lock prevents double booking! <<<
```

---

## 📖 Complete User Guide

For detailed step-by-step instructions, demo user testing, and manual multi-browser verification, please see **[USER_GUIDE.md](USER_GUIDE.md)**.
