/**
 * File: client/src/components/BookingHistoryModal.jsx
 * Description:
 *   User Booking History Dialog.
 *   - Fetches and displays all past confirmed tickets for the authenticated user (/api/bookings).
 *   - Allows re-opening and viewing individual digital passes.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Ticket, X, Calendar, DollarSign, AlertCircle } from 'lucide-react';

export const BookingHistoryModal = ({ isOpen, onClose, onViewTicket }) => {
  const { authHeaders, API_BASE } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/bookings`, {
          headers: authHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings || []);
        }
      } catch (err) {
        console.error('Failed to load bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel p-6 shadow-2xl border border-slate-700/60 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">My Bookings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of bookings */}
        <div className="overflow-y-auto py-4 space-y-3 flex-1">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading your tickets...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10">
              <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-300">No bookings yet</p>
              <p className="text-xs text-slate-500 mt-1">Select seats on the map and complete checkout to see them here.</p>
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-indigo-400">{b.bookingRef}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    Seats: {b.seatIds.join(', ')}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(b.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-100 mb-1.5">${b.totalPrice?.toFixed(2)}</p>
                  <button
                    onClick={() => {
                      onViewTicket(b);
                      onClose();
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 transition"
                  >
                    View Pass
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
