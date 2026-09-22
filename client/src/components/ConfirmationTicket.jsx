import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle, Film, Calendar, MapPin, Ticket, Sparkles, Download, X } from 'lucide-react';

export const ConfirmationTicket = ({ booking, onClose }) => {
  useEffect(() => {
    // Launch celebratory confetti burst
    if (booking) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.log('Confetti trigger', err);
      }
    }
  }, [booking]);

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-md">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-slate-300 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Digital Ticket Pass Container */}
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-700/80">
          {/* Top Pass Header */}
          <div className="p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white relative">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide">
                <Sparkles className="w-3 h-3 text-amber-300" /> CONFIRMED BOOKING
              </span>
              <span className="text-xs font-mono font-bold tracking-wider text-indigo-200">
                {booking.bookingRef}
              </span>
            </div>

            <h3 className="text-2xl font-black tracking-tight mb-1 font-['Space_Grotesk']">
              Interstellar: IMAX Special
            </h3>
            <p className="text-xs text-indigo-200">Hall 4 • Dolby Atmos 3D Experience</p>
          </div>

          {/* Ticket Body */}
          <div className="p-6 space-y-4 bg-[#0d1322]">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 font-medium flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Date & Time
                </span>
                <p className="font-semibold text-slate-200">Today, 8:30 PM</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Cinema
                </span>
                <p className="font-semibold text-slate-200">CineReserve IMAX 1</p>
              </div>
            </div>

            {/* Booked Seats Pills */}
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-2">Booked Seats</span>
              <div className="flex flex-wrap gap-2">
                {booking.seats?.map((seat) => (
                  <div
                    key={seat.id}
                    className="flex items-center gap-1.5 py-1 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Seat {seat.id}</span>
                    <span className="text-[10px] text-emerald-400/80 font-normal">({seat.tier})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Paid & Holder info */}
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
              <div>
                <p className="text-slate-500">Ticket Holder</p>
                <p className="font-semibold text-slate-200">{booking.userName}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Total Paid</p>
                <p className="text-lg font-black text-emerald-400">${booking.totalPrice?.toFixed(2)}</p>
              </div>
            </div>

            {/* Stylized Barcode */}
            <div className="pt-4 border-t border-dashed border-slate-800 flex flex-col items-center">
              <div className="h-10 w-full bg-slate-800/80 rounded-lg flex items-center justify-center tracking-[0.4em] font-mono text-[10px] text-slate-400 select-none">
                |||||| | ||||| || |||||| | ||| ||||
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1">E-TICKET VERIFIED & SCANNABLE</span>
            </div>
          </div>

          {/* Ticket Footer Action */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-3">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
            >
              Done / Book More Seats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
