/**
 * File: client/src/components/CheckoutModal.jsx
 * Description:
 *   Time-Sensitive Checkout & Payment Modal.
 *   - Implements a live 5-minute hold countdown timer with color-coded warning/danger thresholds.
 *   - Auto-triggers cancellation if hold timer expires.
 *   - Renders reserved seat items breakdown, total calculation, and mock payment form.
 */

import React, { useState, useEffect } from 'react';
import { Clock, CreditCard, ShieldCheck, AlertTriangle, X, Check, Lock } from 'lucide-react';

export const CheckoutModal = ({
  isOpen,
  onClose,
  heldSeats,
  holdExpiresAt,
  onCompleteBooking,
  onCancelHold,
  loading
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('987');
  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    if (!isOpen || !holdExpiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((holdExpiresAt - now) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(interval);
        onCancelHold();
      }
    }, 1000);

    const initialDiff = Math.max(0, Math.floor((holdExpiresAt - Date.now()) / 1000));
    setTimeLeft(initialDiff);

    return () => clearInterval(interval);
  }, [isOpen, holdExpiresAt, onCancelHold]);

  if (!isOpen || !heldSeats || heldSeats.length === 0) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalPrice = heldSeats.reduce((acc, s) => acc + s.price, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCompleteBooking(paymentMethod === 'card' ? 'Visa •••• 4242' : 'Apple Pay / Digital Wallet');
  };

  const isTimerCritical = timeLeft <= 60;
  const isTimerWarning = timeLeft <= 120 && !isTimerCritical;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl border border-slate-700/60 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">Complete Reservation</h2>
            <p className="text-xs text-slate-400">Lock confirmed! Finish payment before time expires.</p>
          </div>
          <button
            onClick={onCancelHold}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Hold Countdown Timer */}
        <div
          className={`my-4 p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
            isTimerCritical
              ? 'bg-red-500/15 border-red-500/40 text-red-300'
              : isTimerWarning
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${isTimerCritical ? 'animate-bounce text-red-400' : 'animate-pulse'}`} />
            <div>
              <p className="text-xs font-semibold">Seat Hold Timer</p>
              <p className="text-[11px] opacity-80">Seats will be released to public if timer runs out.</p>
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-wider">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Selected Seats Breakdown */}
        <div className="space-y-3 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Reserved Seats ({heldSeats.length})</span>
              <span className="font-medium text-slate-300">Price</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {heldSeats.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-xs text-indigo-200 font-semibold"
                >
                  <span>Seat {s.id}</span>
                  <span className="text-[10px] text-indigo-400 font-normal">({s.tier})</span>
                  <span className="text-slate-300">${s.price}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white">
              <span>Total Payable</span>
              <span className="text-indigo-400 text-lg">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                paymentMethod === 'card'
                  ? 'bg-indigo-600/30 border-indigo-500 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Credit Card
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('wallet')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                paymentMethod === 'wallet'
                  ? 'bg-indigo-600/30 border-indigo-500 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Digital Wallet
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Card Number (Mock Demo)</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Expiry Date</label>
              <input
                type="text"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">CVV</label>
              <input
                type="text"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancelHold}
              disabled={loading}
              className="w-1/3 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              Cancel Hold
            </button>
            <button
              type="submit"
              disabled={loading || timeLeft <= 0}
              className="w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              {loading ? 'Confirming...' : `Pay $${totalPrice.toFixed(2)} & Book`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
