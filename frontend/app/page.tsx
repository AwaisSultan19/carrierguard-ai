"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, UserButton } from '@clerk/nextjs';
import {
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  FileText,
  Zap,
  Menu,
  X,
  Search,
} from 'lucide-react';

export default function LandingPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const trustFeatures = [
    { icon: ShieldCheck, title: 'Real-Time FMCSA Verification', desc: 'Live authority and safety data pulled directly from FMCSA databases.' },
    { icon: BrainCircuit, title: 'AI Risk Score', desc: 'Machine learning model evaluates safety, compliance, and crash history.' },
    { icon: FileText, title: 'PDF Report Export', desc: 'Download professional carrier reports for your records.' },
    { icon: Zap, title: 'Results in Under 30 Seconds', desc: 'Complete carrier verification in seconds, not hours.' },
  ];

  const howItWorks = [
    { step: 1, icon: Search, title: 'Enter an MC or DOT number', desc: 'Type in any carrier\'s MC or DOT number to start the verification process.' },
    { step: 2, icon: ShieldCheck, title: 'CarrierGuard verifies FMCSA and compliance data', desc: 'We scan FMCSA, insurance, safety, and authority records in real time.' },
    { step: 3, icon: FileText, title: 'Review the AI-powered carrier report', desc: 'Get a comprehensive report with risk score, violations, and AI recommendation.' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden ring-1 ring-gray-700/50 group-hover:ring-orange-500/30 transition-all">
              <Image src="/logo.png" alt="CarrierGuard AI" fill className="object-cover" />
            </div>
            <span className="font-bold text-lg text-white hidden sm:inline">CarrierGuard</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <a href="#features" className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-800/50">Features</a>
            <a href="#how-it-works" className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-800/50">How It Works</a>
          </nav>

          <div className="flex items-center gap-3">
            {!authLoaded ? null : isSignedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 px-4 h-9 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                >
                  Dashboard
                </Link>
                <UserButton
                  appearance={{
                    elements: { userButtonAvatarBox: "w-8 h-8", userButtonOuterIdentifier: "text-gray-300" },
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="px-4 h-9 flex items-center text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-5 h-9 flex items-center text-sm font-semibold text-white bg-orange-500 hover:bg-orange-400 rounded-lg shadow-lg shadow-orange-500/20 transition-all active:scale-[0.97]"
                >
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>
            )}
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors">
              {showMobileMenu ? <X className="w-5 h-5 text-gray-400" /> : <Menu className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-800/50 bg-gray-950">
            <div className="px-4 py-4 space-y-1">
              <a href="#features" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800/50 transition-colors text-gray-300">
                Features
              </a>
              <a href="#how-it-works" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800/50 transition-colors text-gray-300">
                How It Works
              </a>
              {!isSignedIn && (
                <>
                  <div className="border-t border-gray-800/50 my-2" />
                  <Link href="/sign-in" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800/50 transition-colors text-gray-300">
                    <LogInIcon className="w-4 h-4 text-gray-500" />
                    Sign In
                  </Link>
                  <Link href="/sign-up" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 text-orange-400 font-semibold transition-colors">
                    <UserPlusIcon className="w-4 h-4" />
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ─── Hero + Search ─── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/3 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto px-6 text-center pt-24 md:pt-32 pb-32 md:pb-40">
            <div className="w-full max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs font-medium text-orange-400 mb-8">
                <Zap className="w-3.5 h-3.5" />
                Carrier Verification — Instant Results
              </div>
              <h1 className="text-[clamp(2rem,5vw,4.5rem)] font-extrabold text-white tracking-tight leading-tight mb-6">
                Verify Any Carrier in{" "}
                <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                  Under 30 Seconds
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed mb-10">
                Instantly verify FMCSA records, operating authority, safety history,
                insurance, and AI-powered risk analysis before booking a load.
              </p>

              <Link
                href="/sign-up"
                className="inline-flex h-14 px-10 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all items-center justify-center gap-2.5 text-base active:scale-[0.97]"
              >
                <ShieldCheck className="w-5 h-5" />
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Trust Section ─── */}
          <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Everything you need to vet carriers
              </h2>
              <p className="text-gray-400">
                Make informed decisions with comprehensive carrier data at your fingertips.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trustFeatures.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="group bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-orange-500/30 hover:bg-gray-900/80 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-all ring-1 ring-orange-500/20 group-hover:ring-orange-500/30">
                      <Icon className="w-6 h-6 text-orange-400" />
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

        {/* ─── How It Works ─── */}
          <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Three steps to verify any carrier
              </h2>
              <p className="text-gray-400">
                No account required. Start your first search in seconds.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {howItWorks.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="relative bg-gray-900/60 border border-gray-800 rounded-2xl p-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-orange-500/10 flex items-center justify-center ring-1 ring-orange-500/20">
                      <Icon className="w-7 h-7 text-orange-400" />
                    </div>
                    <div className="absolute -top-3 right-6 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-orange-500/20">
                      {step.step}
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-2">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

        {/* ─── CTA ─── */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-orange-950/30 border border-gray-800 rounded-3xl p-10 sm:p-16 text-center overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Verify carriers with confidence
                </h2>
                <p className="text-gray-400 mb-8">
                  Join thousands of freight brokers who trust CarrierGuard for real-time carrier verification.
                </p>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex h-12 px-8 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all items-center gap-2 active:scale-[0.97] text-sm"
                >
                  Start Your First Search
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-800/50 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <span>&copy; {new Date().getFullYear()} CarrierGuard AI. All rights reserved.</span>
          <div className="flex items-center gap-6">
            {!isSignedIn && (
              <>
                <Link href="/sign-in" className="hover:text-gray-400 transition-colors">Sign In</Link>
                <Link href="/sign-up" className="hover:text-gray-400 transition-colors">Create Account</Link>
              </>
            )}
            {isSignedIn && (
              <Link href="/dashboard" className="hover:text-gray-400 transition-colors">Dashboard</Link>
            )}
            <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
          </div>
        </div>
      </footer>


    </div>
  );
}

function LogInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}
