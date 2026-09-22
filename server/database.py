import json
import os
import time
import uuid
import asyncio
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), 'data.json')

def generate_initial_seats() -> List[Dict[str, Any]]:
    seats = []
    rows = [
        {'letter': 'A', 'tier': 'VIP', 'price': 25.0, 'count': 8},
        {'letter': 'B', 'tier': 'VIP', 'price': 25.0, 'count': 8},
        {'letter': 'C', 'tier': 'Standard', 'price': 15.0, 'count': 10},
        {'letter': 'D', 'tier': 'Standard', 'price': 15.0, 'count': 10},
        {'letter': 'E', 'tier': 'Standard', 'price': 15.0, 'count': 10},
        {'letter': 'F', 'tier': 'Standard', 'price': 15.0, 'count': 10}
    ]

    for row in rows:
        for i in range(1, row['count'] + 1):
            seat_id = f"{row['letter']}{i}"
            seats.append({
                'id': seat_id,
                'row': row['letter'],
                'number': i,
                'tier': row['tier'],
                'price': row['price'],
                'status': 'AVAILABLE', # 'AVAILABLE', 'HOLD', 'BOOKED'
                'heldBy': None,
                'heldByName': None,
                'holdExpiresAt': None, # timestamp in ms
                'bookedBy': None,
                'bookedByName': None,
                'bookingRef': None
            })
    return seats

class Database:
    def __init__(self):
        self._lock = asyncio.Lock()
        self.data = self._load()

    def _load(self) -> Dict[str, Any]:
        if not os.path.exists(DB_FILE):
            initial_data = {
                'users': [],
                'seats': generate_initial_seats(),
                'bookings': []
            }
            self._save(initial_data)
            return initial_data
        try:
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading data file: {e}")
            return {
                'users': [],
                'seats': generate_initial_seats(),
                'bookings': []
            }

    def _save(self, data: Optional[Dict[str, Any]] = None):
        try:
            with open(DB_FILE, 'w', encoding='utf-8') as f:
                json.dump(data or self.data, f, indent=2)
        except Exception as e:
            print(f"Error saving data file: {e}")

    async def get_users(self) -> List[Dict[str, Any]]:
        async with self._lock:
            return list(self.data['users'])

    async def find_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        async with self._lock:
            email_lower = email.lower()
            return next((u for u in self.data['users'] if u['email'].lower() == email_lower), None)

    async def add_user(self, user: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock:
            self.data['users'].append(user)
            self._save()
            return user

    async def get_seats(self) -> List[Dict[str, Any]]:
        async with self._lock:
            # Sync expired holds on fetch
            now = int(time.time() * 1000)
            changed = False
            for seat in self.data['seats']:
                if seat['status'] == 'HOLD' and seat['holdExpiresAt'] and seat['holdExpiresAt'] <= now:
                    seat['status'] = 'AVAILABLE'
                    seat['heldBy'] = None
                    seat['heldByName'] = None
                    seat['holdExpiresAt'] = None
                    changed = True
            if changed:
                self._save()
            return [dict(s) for s in self.data['seats']]

    async def hold_seats_atomic(
        self, 
        seat_ids: List[str], 
        user_id: str, 
        user_name: str, 
        hold_duration_seconds: int = 300
    ) -> Dict[str, Any]:
        """
        ATOMIC seat hold operation protected by asyncio.Lock.
        Prevents concurrent requests from race-condition double booking.
        """
        async with self._lock:
            now = int(time.time() * 1000)
            expires_at = now + (hold_duration_seconds * 1000)

            # Check eligibility for ALL requested seats
            unavailable = []
            seats_map = {s['id']: s for s in self.data['seats']}

            for sid in seat_ids:
                if sid not in seats_map:
                    unavailable.append({'seatId': sid, 'reason': 'Seat does not exist'})
                    continue

                seat = seats_map[sid]
                if seat['status'] == 'BOOKED':
                    unavailable.append({'seatId': sid, 'reason': 'Already booked'})
                elif seat['status'] == 'HOLD' and seat['heldBy'] != user_id and seat['holdExpiresAt'] > now:
                    unavailable.append({'seatId': sid, 'reason': f"Held by {seat.get('heldByName') or 'another user'}"})

            if unavailable:
                return {
                    'success': False,
                    'error': 'One or more requested seats are unavailable',
                    'details': unavailable
                }

            # Apply hold
            updated_seats = []
            for sid in seat_ids:
                seat = seats_map[sid]
                seat['status'] = 'HOLD'
                seat['heldBy'] = user_id
                seat['heldByName'] = user_name
                seat['holdExpiresAt'] = expires_at
                updated_seats.append(dict(seat))

            self._save()
            return {
                'success': True,
                'seats': updated_seats,
                'holdExpiresAt': expires_at
            }

    async def release_hold_atomic(self, seat_ids: List[str], user_id: str, force: bool = False) -> int:
        async with self._lock:
            released_count = 0
            for seat in self.data['seats']:
                if seat['id'] in seat_ids:
                    if force or seat['heldBy'] == user_id:
                        seat['status'] = 'AVAILABLE'
                        seat['heldBy'] = None
                        seat['heldByName'] = None
                        seat['holdExpiresAt'] = None
                        released_count += 1
            if released_count > 0:
                self._save()
            return released_count

    async def cleanup_expired_holds(self) -> List[str]:
        async with self._lock:
            now = int(time.time() * 1000)
            expired_ids = []
            for seat in self.data['seats']:
                if seat['status'] == 'HOLD' and seat['holdExpiresAt'] and seat['holdExpiresAt'] <= now:
                    seat['status'] = 'AVAILABLE'
                    seat['heldBy'] = None
                    seat['heldByName'] = None
                    seat['holdExpiresAt'] = None
                    expired_ids.append(seat['id'])
            if expired_ids:
                self._save()
            return expired_ids

    async def book_seats_atomic(
        self, 
        seat_ids: List[str], 
        user_id: str, 
        user_name: str, 
        payment_method: str = "Mock Card"
    ) -> Dict[str, Any]:
        """
        ATOMIC booking finalization after mock payment.
        Validates hold ownership before updating status to BOOKED.
        """
        async with self._lock:
            now = int(time.time() * 1000)
            seats_map = {s['id']: s for s in self.data['seats']}

            for sid in seat_ids:
                if sid not in seats_map:
                    return {'success': False, 'error': f"Seat {sid} not found"}
                seat = seats_map[sid]
                if seat['status'] == 'BOOKED':
                    return {'success': False, 'error': f"Seat {sid} is already booked"}
                if seat['status'] == 'HOLD' and seat['heldBy'] != user_id and seat['holdExpiresAt'] > now:
                    return {'success': False, 'error': f"Seat {sid} is held by another user"}

            # Calculate total
            booked_seats = [seats_map[sid] for sid in seat_ids]
            total_price = sum(s['price'] for s in booked_seats)
            booking_ref = f"BK-{uuid.uuid4().hex[:6].upper()}"

            booking = {
                'id': f"b_{int(time.time()*1000)}",
                'bookingRef': booking_ref,
                'userId': user_id,
                'userName': user_name,
                'seatIds': seat_ids,
                'seats': [{'id': s['id'], 'row': s['row'], 'number': s['number'], 'tier': s['tier'], 'price': s['price']} for s in booked_seats],
                'totalPrice': total_price,
                'paymentMethod': payment_method,
                'status': 'CONFIRMED',
                'createdAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            }

            for seat in booked_seats:
                seat['status'] = 'BOOKED'
                seat['heldBy'] = None
                seat['heldByName'] = None
                seat['holdExpiresAt'] = None
                seat['bookedBy'] = user_id
                seat['bookedByName'] = user_name
                seat['bookingRef'] = booking_ref

            self.data['bookings'].append(booking)
            self._save()
            return {'success': True, 'booking': booking}

    async def get_user_bookings(self, user_id: str) -> List[Dict[str, Any]]:
        async with self._lock:
            return [b for b in self.data['bookings'] if b['userId'] == user_id]

    async def reset_seats(self) -> List[Dict[str, Any]]:
        async with self._lock:
            self.data['seats'] = generate_initial_seats()
            self.data['bookings'] = []
            self._save()
            return list(self.data['seats'])

db = Database()
