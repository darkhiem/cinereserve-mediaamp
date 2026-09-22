/**
 * File: client/src/components/SeatMap.jsx
 * Description:
 *   Interactive Theater Hall & Seat Grid Component.
 *   - Renders curved illuminated cinema screen and 6-row seating layout (Rows A-F).
 *   - Displays dynamic visual states: Available, VIP Gold, Selected, Held by Others, and Booked.
 *   - Handles interactive user click toggles.
 */

import React from 'react';
import { Crown, Lock, Check, User } from 'lucide-react';

export const SeatMap = ({ seats, selectedSeatIds, onToggleSeat, currentUserId }) => {
  // Group seats by row
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];

  const getSeatsByRow = (rowLetter) => {
    return seats
      .filter((s) => s.row === rowLetter)
      .sort((a, b) => a.number - b.number);
  };

  const getSeatStatus = (seat) => {
    const isSelected = selectedSeatIds.includes(seat.id);
    const isBooked = seat.status === 'BOOKED';
    const isHeld = seat.status === 'HOLD';
    const isHeldByMe = isHeld && seat.heldBy === currentUserId;
    const isHeldByOther = isHeld && seat.heldBy !== currentUserId;

    return {
      isSelected,
      isBooked,
      isHeld,
      isHeldByMe,
      isHeldByOther
    };
  };

  return (
    <div className="w-full flex flex-col items-center py-6">
      {/* Cinema Screen Curve */}
      <div className="w-full max-w-2xl mb-12 flex flex-col items-center">
        <div className="w-full h-10 border-t-4 border-indigo-500/60 rounded-t-[100px] glow-screen flex items-center justify-center">
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-indigo-300 drop-shadow">
            C I N E M A   S C R E E N
          </span>
        </div>
        <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent blur-xs"></div>
      </div>

      {/* Grid of Seats */}
      <div className="space-y-4 w-full max-w-3xl overflow-x-auto pb-4 flex flex-col items-center">
        {rows.map((rowLetter) => {
          const rowSeats = getSeatsByRow(rowLetter);
          const isVip = rowLetter === 'A' || rowLetter === 'B';

          return (
            <div key={rowLetter} className="flex items-center gap-3 sm:gap-4">
              {/* Row Label Left */}
              <div className="w-6 text-center font-bold text-xs text-slate-500 font-mono">
                {rowLetter}
              </div>

              {/* Seats in Row */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                {rowSeats.map((seat) => {
                  const { isSelected, isBooked, isHeld, isHeldByMe, isHeldByOther } = getSeatStatus(seat);

                  let btnClasses = 'relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer ';
                  
                  if (isBooked) {
                    btnClasses += 'bg-slate-900/90 border border-slate-800 text-slate-600 cursor-not-allowed opacity-60';
                  } else if (isHeldByOther) {
                    btnClasses += 'bg-amber-950/40 border border-amber-500/60 text-amber-400 cursor-not-allowed animate-pulse shadow-sm shadow-amber-500/20';
                  } else if (isHeldByMe) {
                    btnClasses += 'bg-emerald-600 border border-emerald-400 text-white glow-emerald scale-105';
                  } else if (isSelected) {
                    btnClasses += 'bg-indigo-600 border border-indigo-300 text-white glow-indigo scale-105';
                  } else if (isVip) {
                    btnClasses += 'bg-slate-800/90 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:bg-slate-800 hover:scale-105';
                  } else {
                    btnClasses += 'bg-slate-800/90 border border-slate-700 hover:border-indigo-400 text-slate-300 hover:bg-slate-700 hover:scale-105';
                  }

                  return (
                    <button
                      key={seat.id}
                      disabled={isBooked || isHeldByOther}
                      onClick={() => onToggleSeat(seat)}
                      title={`${seat.id} - ${seat.tier} ($${seat.price}) ${isBooked ? '(Booked)' : isHeldByOther ? `(Held by ${seat.heldByName || 'Another'})` : ''}`}
                      className={btnClasses}
                    >
                      {isBooked ? (
                        <span className="text-[10px] text-slate-600">✕</span>
                      ) : isHeldByOther ? (
                        <div className="flex flex-col items-center">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span className="text-[8px] font-normal leading-none truncate max-w-[28px] mt-0.5">
                            {seat.heldByName ? seat.heldByName.split(' ')[0] : 'Held'}
                          </span>
                        </div>
                      ) : isHeldByMe ? (
                        <div className="flex flex-col items-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span className="text-[8px] leading-none font-semibold">Held</span>
                        </div>
                      ) : isSelected ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : isVip ? (
                        <div className="flex flex-col items-center">
                          <Crown className="w-2.5 h-2.5 text-amber-400 mb-0.5" />
                          <span className="text-[10px]">{seat.number}</span>
                        </div>
                      ) : (
                        <span className="text-[11px]">{seat.number}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row Label Right */}
              <div className="w-6 text-center font-bold text-xs text-slate-500 font-mono">
                {rowLetter}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
