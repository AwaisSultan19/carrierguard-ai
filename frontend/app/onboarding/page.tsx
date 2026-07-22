"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { completeOnboarding, getUserProfile } from '@/lib/api';

const ROLES = [
  { value: 'freight_broker', label: 'Freight Broker' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'carrier', label: 'Carrier' },
  { value: 'other', label: 'Other' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    getToken().then((token) =>
      getUserProfile(token)
    ).then((profile) => {
      if ((profile as any)?.onboarding_completed) {
        router.replace('/dashboard');
      } else {
        if ((profile as any)?.company_name) setCompanyName((profile as any).company_name);
        if ((profile as any)?.role) setRole((profile as any).role);
      }
    }).catch(() => {}).finally(() => setChecking(false));
  }, [isLoaded, isSignedIn, getToken, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      await completeOnboarding({ company_name: companyName, role }, token);
      router.push('/dashboard');
    } catch {
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    try {
      const token = await getToken();
      await completeOnboarding({}, token);
    } catch {} finally {
      router.push('/dashboard');
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <div className="w-10 h-10 mx-auto mb-6 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center">
            <Image src="/logo.png" alt="" width={22} height={22} className="rounded" />
          </div>
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">
            Set up your account
          </h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Tell us about your company so we can tailor your experience.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-7 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company name
                </label>
                <input
                  id="company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Logistics"
                  className="block w-full h-10 px-3.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full h-10 px-3.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                >
                  <option value="">Select your role</option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-10 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 active:scale-[0.98] rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Continue'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={saving}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-1.5 transition-colors disabled:opacity-50"
                >
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          You can always update these later in Settings.
        </p>
      </div>
    </div>
  );
}
