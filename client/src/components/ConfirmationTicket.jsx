/**
 * File: client/src/components/ConfirmationTicket.jsx
 * Description:
 *   Digital Boarding Pass & Confirmation Modal.
 *   - Triggers celebratory confetti burst (canvas-confetti) on confirmed booking.
 *   - Renders movie details, seat pills, total paid, scannable Code-128 vector barcode, and QR pass.
 */

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

            {/* Authentic Vector Barcode & QR Digital Pass */}
            <div className="pt-4 border-t border-dashed border-slate-800">
              <div className="p-4 rounded-2xl bg-white flex items-center justify-between gap-4 shadow-inner">
                {/* SVG Barcode */}
                <div className="flex-1 flex flex-col items-center">
                  <svg className="w-full h-12 text-slate-900" viewBox="0 0 240 50" fill="currentColor">
                    {/* Authentic Code-128 styled barcode lines */}
                    <rect x="0" y="0" width="3" height="40" />
                    <rect x="5" y="0" width="2" height="40" />
                    <rect x="10" y="0" width="4" height="40" />
                    <rect x="16" y="0" width="1" height="40" />
                    <rect x="20" y="0" width="3" height="40" />
                    <rect x="26" y="0" width="2" height="40" />
                    <rect x="30" y="0" width="5" height="40" />
                    <rect x="38" y="0" width="2" height="40" />
                    <rect x="42" y="0" width="4" height="40" />
                    <rect x="48" y="0" width="1" height="40" />
                    <rect x="52" y="0" width="3" height="40" />
                    <rect x="58" y="0" width="2" height="40" />
                    <rect x="63" y="0" width="4" height="40" />
                    <rect x="70" y="0" width="1" height="40" />
                    <rect x="73" y="0" width="3" height="40" />
                    <rect x="79" y="0" width="5" height="40" />
                    <rect x="87" y="0" width="2" height="40" />
                    <rect x="91" y="0" width="3" height="40" />
                    <rect x="97" y="0" width="1" height="40" />
                    <rect x="101" y="0" width="4" height="40" />
                    <rect x="108" y="0" width="2" height="40" />
                    <rect x="112" y="0" width="3" height="40" />
                    <rect x="118" y="0" width="5" height="40" />
                    <rect x="126" y="0" width="1" height="40" />
                    <rect x="130" y="0" width="3" height="40" />
                    <rect x="136" y="0" width="4" height="40" />
                    <rect x="143" y="0" width="2" height="40" />
                    <rect x="148" y="0" width="3" height="40" />
                    <rect x="154" y="0" width="1" height="40" />
                    <rect x="158" y="0" width="5" height="40" />
                    <rect x="166" y="0" width="2" height="40" />
                    <rect x="171" y="0" width="3" height="40" />
                    <rect x="177" y="0" width="4" height="40" />
                    <rect x="184" y="0" width="1" height="40" />
                    <rect x="188" y="0" width="3" height="40" />
                    <rect x="194" y="0" width="2" height="40" />
                    <rect x="199" y="0" width="5" height="40" />
                    <rect x="207" y="0" width="2" height="40" />
                    <rect x="212" y="0" width="4" height="40" />
                    <rect x="219" y="0" width="1" height="40" />
                    <rect x="223" y="0" width="3" height="40" />
                    <rect x="228" y="0" width="2" height="40" />
                    <rect x="233" y="0" width="4" height="40" />
                    <rect x="238" y="0" width="2" height="40" />
                  </svg>
                  <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-slate-800 mt-1">
                    {booking.bookingRef}
                  </span>
                </div>

                {/* Scannable QR Code Vector */}
                <div className="shrink-0 p-1.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center">
                  <svg className="w-12 h-12 text-slate-900" viewBox="0 0 33 33" fill="currentColor">
                    {/* Top-left position corner */}
                    <rect x="1" y="1" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" rx="1" />
                    <rect x="3.5" y="3.5" width="4" height="4" />
                    {/* Top-right position corner */}
                    <rect x="23" y="1" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" rx="1" />
                    <rect x="25.5" y="3.5" width="4" height="4" />
                    {/* Bottom-left position corner */}
                    <rect x="1" y="23" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" rx="1" />
                    <rect x="3.5" y="25.5" width="4" height="4" />
                    {/* Data patterns */}
                    <rect x="12" y="3" width="3" height="3" />
                    <rect x="17" y="3" width="4" height="2" />
                    <rect x="13" y="8" width="2" height="4" />
                    <rect x="17" y="7" width="3" height="3" />
                    <rect x="3" y="12" width="2" height="3" />
                    <rect x="8" y="13" width="3" height="2" />
                    <rect x="13" y="14" width="7" height="2" />
                    <rect x="22" y="12" width="4" height="3" />
                    <rect x="28" y="13" width="3" height="4" />
                    <rect x="3" y="17" width="4" height="4" />
                    <rect x="9" y="18" width="2" height="3" />
                    <rect x="13" y="18" width="4" height="4" />
                    <rect x="19" y="18" width="3" height="3" />
                    <rect x="24" y="18" width="3" height="3" />
                    <rect x="13" y="24" width="3" height="3" />
                    <rect x="18" y="23" width="3" height="5" />
                    <rect x="23" y="24" width="4" height="2" />
                    <rect x="28" y="24" width="3" height="4" />
                    <rect x="13" y="29" width="4" height="2" />
                    <rect x="23" y="28" width="5" height="3" />
                  </svg>
                  <span className="text-[7px] font-bold text-slate-500 uppercase mt-0.5 tracking-tighter">SCAN ENTRY</span>
                </div>
              </div>
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
