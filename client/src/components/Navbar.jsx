/**
 * File: client/src/components/Navbar.jsx
 * Description:
 *   Top Application Navigation Header.
 *   - Displays brand logo, live WebSocket connection status pulse (🟢 Live / 🔴 Offline).
 *   - Provides action buttons for Resetting Map, Viewing Tickets, and User Auth/Profile menu.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Film, User, LogOut, RotateCcw, Ticket, Wifi, WifiOff } from 'lucide-react';

export const Navbar = ({ wsConnected, onOpenAuth, onOpenBookings, onResetSeats }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent font-['Space_Grotesk']">
              CineReserve
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                {wsConnected ? 'Live Sync Active' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions & User profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reset Seats Button */}
          <button
            onClick={onResetSeats}
            title="Reset all seats to Available"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Reset Map</span>
          </button>

          {user ? (
            <>
              {/* My Bookings */}
              <button
                onClick={onOpenBookings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 text-xs font-medium text-indigo-300 hover:text-indigo-200 transition"
              >
                <Ticket className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">My Tickets</span>
              </button>

              {/* User Profile Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <p className="font-semibold text-slate-200 leading-tight truncate max-w-[110px]">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
