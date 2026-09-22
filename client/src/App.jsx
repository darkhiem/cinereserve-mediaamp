import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { SeatLegend } from './components/SeatLegend';
import { SeatMap } from './components/SeatMap';
import { CheckoutModal } from './components/CheckoutModal';
import { ConfirmationTicket } from './components/ConfirmationTicket';
import { BookingHistoryModal } from './components/BookingHistoryModal';
import { AuthModal } from './components/AuthModal';
import { Sparkles, ShoppingBag, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, Zap } from 'lucide-react';

const MainApp = () => {
  const { user, token, authHeaders, API_BASE } = useAuth();

  const [seats, setSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [heldSeats, setHeldSeats] = useState([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  
  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);

  // Notifications & Loaders
  const [notification, setNotification] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Initial Fetch & WebSocket setup
  const fetchSeats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/seats`);
      if (res.ok) {
        const data = await res.json();
        setSeats(data.seats || []);
      }
    } catch (err) {
      console.error('Failed to fetch initial seats:', err);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchSeats();

    const connectWebSocket = () => {
      const wsUrl = 'ws://127.0.0.1:8000/ws';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'INITIAL_SEATS' || data.event === 'SEATS_UPDATED') {
            setSeats(data.seats || []);

            // Handle specific events for user toast alerts
            if (data.reason === 'HOLD_EXPIRED') {
              showToast(`Seat hold expired for ${data.expiredSeatIds.join(', ')}. Returned to pool.`, 'info');
            } else if (data.reason === 'RESET') {
              showToast('Seat layout was reset to Available by admin.', 'info');
              setSelectedSeatIds([]);
              setHeldSeats([]);
              setIsCheckoutOpen(false);
            }
          }
        } catch (e) {
          console.error('WS Parse Error', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [fetchSeats]);

  // Seat toggle selection
  const handleToggleSeat = (seat) => {
    if (seat.status === 'BOOKED') return;
    if (seat.status === 'HOLD' && seat.heldBy !== user?.id) return;

    // If seat is currently held by this user, open checkout
    if (seat.status === 'HOLD' && seat.heldBy === user?.id) {
      const userHeldSeats = seats.filter(s => s.status === 'HOLD' && s.heldBy === user?.id);
      setHeldSeats(userHeldSeats);
      setHoldExpiresAt(seat.holdExpiresAt);
      setIsCheckoutOpen(true);
      return;
    }

    // Otherwise toggle selection for available seat
    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id);
      } else {
        return [...prev, seat.id];
      }
    });
  };

  // Lock & Hold Seats (Atomic Operation)
  const handleHoldSelectedSeats = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    if (selectedSeatIds.length === 0) return;

    setLoadingAction(true);
    try {
      const res = await fetch(`${API_BASE}/api/seats/hold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          seatIds: selectedSeatIds,
          holdDurationSeconds: 300 // 5-minute hold
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail?.error || data.detail || 'Seat hold failed due to conflict');
      }

      setHeldSeats(data.seats);
      setHoldExpiresAt(data.holdExpiresAt);
      setSelectedSeatIds([]);
      setIsCheckoutOpen(true);
      showToast(`Successfully locked ${data.seats.length} seat(s) for 5 minutes!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      // Refresh seats immediately
      fetchSeats();
    } finally {
      setLoadingAction(false);
    }
  };

  // Complete Booking (Pay)
  const handleCompleteBooking = async (paymentMethod) => {
    if (!heldSeats.length) return;
    setLoadingAction(true);

    try {
      const res = await fetch(`${API_BASE}/api/seats/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          seatIds: heldSeats.map(s => s.id),
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Booking failed');
      }

      setIsCheckoutOpen(false);
      setHeldSeats([]);
      setActiveBooking(data.booking);
      setIsTicketOpen(true);
      showToast('Booking Confirmed! Seats successfully reserved.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Cancel Hold
  const handleCancelHold = async () => {
    if (!heldSeats.length) {
      setIsCheckoutOpen(false);
      return;
    }

    try {
      await fetch(`${API_BASE}/api/seats/cancel-hold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          seatIds: heldSeats.map(s => s.id)
        })
      });

      setHeldSeats([]);
      setIsCheckoutOpen(false);
      showToast('Hold released. Seats are available again.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Reset Seats
  const handleResetSeats = async () => {
    try {
      await fetch(`${API_BASE}/api/seats/reset`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate pricing for currently selected seats
  const selectedSeatObjects = seats.filter(s => selectedSeatIds.includes(s.id));
  const selectionTotal = selectedSeatObjects.reduce((acc, s) => acc + s.price, 0);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-lg ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-red-950/90 border-red-500/50 text-red-200'
                : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
            {notification.type === 'info' && <Zap className="w-5 h-5 text-indigo-400 shrink-0" />}
            <span className="text-xs font-semibold">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        wsConnected={wsConnected}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenBookings={() => setIsBookingsOpen(true)}
        onResetSeats={handleResetSeats}
      />

      {/* Hero Movie Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Live Interactive Hall • Atomic Concurrency Protected
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Space_Grotesk'] text-white">
          Interstellar: Experience in IMAX Laser
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          Pick your preferred seats. Locked seats sync across all devices in real-time. Complete checkout within 5 minutes.
        </p>

        {/* Legend */}
        <div className="mt-6">
          <SeatLegend />
        </div>
      </section>

      {/* Seat Map */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center justify-center pb-28">
        <div className="w-full glass-card p-4 sm:p-8 rounded-3xl shadow-2xl border border-slate-800/80 my-4 flex flex-col items-center">
          <SeatMap
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={handleToggleSeat}
            currentUserId={user?.id}
          />
        </div>
      </main>

      {/* Floating Bottom Action Bar for Selected Seats */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="glass-panel p-4 rounded-2xl shadow-2xl border border-indigo-500/40 glow-indigo flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></span>
                <p className="text-xs font-bold text-white">
                  {selectedSeatIds.length} Seat{selectedSeatIds.length > 1 ? 's' : ''} Selected
                </p>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                Seats: <span className="text-indigo-300 font-semibold">{selectedSeatIds.join(', ')}</span> • Total: <span className="text-emerald-400 font-bold">${selectionTotal.toFixed(2)}</span>
              </p>
            </div>

            <button
              onClick={handleHoldSelectedSeats}
              disabled={loadingAction}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 flex items-center gap-1.5 transition hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0"
            >
              {loadingAction ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Lock & Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          showToast('Welcome! Your session is authenticated.', 'success');
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        heldSeats={heldSeats}
        holdExpiresAt={holdExpiresAt}
        onCompleteBooking={handleCompleteBooking}
        onCancelHold={handleCancelHold}
        loading={loadingAction}
      />

      <ConfirmationTicket
        booking={activeBooking}
        onClose={() => {
          setIsTicketOpen(false);
          setActiveBooking(null);
        }}
      />

      <BookingHistoryModal
        isOpen={isBookingsOpen}
        onClose={() => setIsBookingsOpen(false)}
        onViewTicket={(booking) => {
          setActiveBooking(booking);
          setIsTicketOpen(true);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
