"use client";

import React from 'react';
import Link from 'next/link';
import { UserPlus, LogIn, Home, CheckCircle, Search, History, FileText, Bookmark, ShieldCheck } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onBackToHome: () => void;
}

export default function UpgradeModal({ open, onBackToHome }: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onBackToHome} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500" />

        <div className="p-8 pt-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-orange-500/10 rounded-2xl flex items-center justify-center ring-1 ring-orange-500/20">
            <ShieldCheck className="w-8 h-8 text-orange-500" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Continue Verifying Carriers
          </h2>

          <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto mb-8">
            You&apos;ve used your 3 free carrier verifications. Create a free CarrierGuard account to continue verifying carriers, save search history, and download PDF reports.
          </p>

          <div className="space-y-3">
            <Link
              href="/sign-up"
              className="w-full h-12 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              Create Free Account
            </Link>

            <Link
              href="/sign-in"
              className="w-full h-12 flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 hover:bg-gray-750 text-gray-200 font-medium rounded-xl transition-all active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>

            <button
              onClick={onBackToHome}
              className="w-full h-12 flex items-center justify-center gap-2 bg-transparent hover:bg-gray-800/50 text-gray-400 font-medium rounded-xl transition-all active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-[11px] uppercase text-gray-500 font-bold tracking-wider mb-4">What you get with an account</p>
            <div className="grid grid-cols-2 gap-2 text-left">
              {[
                { icon: Search, label: 'Unlimited carrier searches' },
                { icon: History, label: 'Search history' },
                { icon: FileText, label: 'PDF report downloads' },
                { icon: Bookmark, label: 'Saved carrier reports' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50">
                  <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-xs text-gray-300 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


