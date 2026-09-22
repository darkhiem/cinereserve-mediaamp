# 📖 CineReserve - User & Developer Guide

This guide walks you through setting up, running, testing, and verifying the **CineReserve** application.

---

## 📋 Table of Contents

1. [System Prerequisites](#1-system-prerequisites)
2. [Step-by-Step Installation](#2-step-by-step-installation)
3. [Running the Application](#3-running-the-application)
4. [User Workflow Walkthrough](#4-user-workflow-walkthrough)
5. [Testing Real-Time Multi-User Sync](#5-testing-real-time-multi-user-sync)
6. [Running the Race Condition Automated Test](#6-running-the-race-condition-automated-test)
7. [API Reference & Swagger Docs](#7-api-reference--swagger-docs)
8. [Troubleshooting & FAQs](#8-troubleshooting--faqs)

---

## 1. System Prerequisites

Before starting, ensure you have the following installed:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **Python**: v3.10, v3.11, or v3.12 (or Anaconda / Miniconda)
- **Git**: ([Download Git](https://git-scm.com/))

---

## 2. Step-by-Step Installation

### Step 2.1: Clone the Repository
```bash
git clone <your-repository-url>
cd mediaamp
```

### Step 2.2: Backend Installation
Using Conda:
```bash
conda create -n seat_booking python=3.12 -y
conda activate seat_booking
cd server
pip install -r requirements.txt
```

*(Or using standard Python `venv`:)*
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

cd server
pip install -r requirements.txt
```

### Step 2.3: Frontend Installation
Open a separate terminal window:
```bash
cd client
npm install
```

---

## 3. Running the Application

### Terminal 1: Start Backend Server
```bash
conda activate seat_booking
cd server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The server will start at: `http://127.0.0.1:8000`

### Terminal 2: Start Frontend Client
```bash
cd client
npm run dev
```
The client will start at: `http://localhost:5173`

---

## 4. User Workflow Walkthrough

1. **Open the App**:
   - Navigate to `http://localhost:5173` in your browser.
2. **Explore the Seat Map**:
   - VIP seats are in rows **A** and **B** ($25 each).
   - Standard seats are in rows **C**, **D**, **E**, and **F** ($15 each).
3. **Select Seats**:
   - Click on any available seats (e.g. `A1`, `A2`).
   - A floating bar appears at the bottom with seat summary and total cost.
4. **Lock & Checkout**:
   - Click **"Lock & Checkout"**.
   - If not signed in, an authentication popup will appear. Click the quick-demo button **"User: Alice"** and click **Sign In**.
   - Your seats are immediately locked with a **5-minute countdown timer**.
5. **Complete Mock Payment**:
   - In the Checkout Modal, review your seats and click **"Pay & Book"**.
6. **View Digital Ticket Pass**:
   - A celebratory confetti burst appears with your digital boarding pass and verified booking reference (e.g., `BK-893C0A`).
7. **View Past Bookings**:
   - Click **"My Tickets"** in the top navigation bar to view your booking history anytime.

---

## 5. Testing Real-Time Multi-User Sync

To verify live WebSocket synchronization between concurrent users:

1. Open **Window 1** (Normal Browser Window):
   - Go to `http://localhost:5173`.
   - Sign in as **Alice**.
   - Select seats `A3` & `A4`, then click **Lock & Checkout**.
2. Open **Window 2** (Incognito / Private Window or another browser):
   - Go to `http://localhost:5173`.
   - Sign in as **Bob**.
3. **Observe**:
   - In Window 2, seats `A3` and `A4` turn **Amber / Orange** with a lock icon and show `Held by Alice` in real time without refreshing.
   - Bob cannot select or steal those seats.
4. When Alice finishes payment in Window 1, Window 2 immediately marks those seats as **Sold Out (Booked ✕)**.

---

## 6. Running the Race Condition Automated Test

The project includes an automated stress test that launches **10 concurrent threads** attempting to reserve the exact same seat (`A1`) simultaneously:

```bash
conda activate seat_booking
cd server
python test_race_condition.py
```

### Expected Result:
- **1 Successful Hold** (`200 OK`)
- **9 Blocked Conflicts** (`409 Conflict`)
- Confirms the thread-safe `asyncio.Lock()` prevents double-booking.

---

## 7. API Reference & Swagger Docs

FastAPI provides an interactive OpenAPI / Swagger UI at:
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

### Key Endpoints:
- `POST /api/auth/signup`: Create a new user account.
- `POST /api/auth/login`: Authenticate and receive a JWT Bearer token.
- `GET /api/seats`: Retrieve live seat layout and status.
- `POST /api/seats/hold`: Atomically lock selected seats for 5 minutes.
- `POST /api/seats/cancel-hold`: Release held seats back to the available pool.
- `POST /api/seats/book`: Finalize reservation and payment.
- `GET /api/bookings`: Retrieve user ticket history.
- `POST /api/seats/reset`: Reset all seats to AVAILABLE state.
- `WS /ws`: WebSocket stream for live seat map updates.

---

## 8. Troubleshooting & FAQs

### Q: Seats remain held when I close the browser?
- The backend runs a background sweeper task every second. Holds automatically expire after 300 seconds (5 minutes) and are returned to the available pool.

### Q: How do I reset the entire seat map for a fresh demo?
- Click the **"Reset Map"** button in the top navbar or send a POST request to `http://127.0.0.1:8000/api/seats/reset`.

### Q: Port 8000 or 5173 is already in use?
- Backend: `python -m uvicorn main:app --port 8001`
- Frontend: `npm run dev -- --port 5174`
