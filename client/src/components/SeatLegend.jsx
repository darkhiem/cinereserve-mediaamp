import React from 'react';
import { Crown, Sparkles, UserCheck, Lock, CheckCircle2 } from 'lucide-react';

export const SeatLegend = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-3 px-6 rounded-2xl glass-card mx-auto max-w-2xl text-xs text-slate-300">
      {/* Available */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-lg bg-slate-800 border border-slate-600 shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-400">
          A1
        </div>
        <span>Available ($15)</span>
      </div>

      {/* VIP Available */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-lg bg-amber-950/70 border border-amber-500/80 shadow-sm flex items-center justify-center text-[10px] font-bold text-amber-400">
          <Crown className="w-3 h-3" />
        </div>
        <span>VIP ($25)</span>
      </div>

      {/* Selected by You */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-lg bg-indigo-600 border border-indigo-400 shadow-sm glow-indigo flex items-center justify-center text-[10px] font-bold text-white">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
        <span>Your Selection</span>
      </div>

      {/* Held by Another User */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-[10px] font-bold text-amber-400 animate-pulse">
          <Lock className="w-3 h-3" />
        </div>
        <span>Held by Others</span>
      </div>

      {/* Booked / Sold */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-lg bg-slate-900 border border-red-900/60 flex items-center justify-center text-[10px] font-bold text-slate-600 cursor-not-allowed">
          ✕
        </div>
        <span>Sold Out</span>
      </div>
    </div>
  );
};
