"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getUserProfile, updateUserProfile, type UserProfile } from '@/lib/api';

export default function ProfilePage() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getToken().then((token) => getUserProfile(token)).then(setProfile).finally(() => setLoading(false));
  }, [getToken]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const token = await getToken();
    const updated = await updateUserProfile(profile, token);
    if (updated) setProfile(updated);
    setSaving(false);
  };
  return (
    <div className="flex-1 max-w-[1000px] mx-auto w-full py-2xl px-gutter">
      {/* Header */}
      <header className="mb-xl">
        <h1 className="font-h1 text-h1 text-on-surface mb-xs">User Profile</h1>
        <p className="text-body-md text-on-surface-variant">Manage your personal information.</p>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Personal Info Card (7 Cols) */}
        <section className="lg:col-span-7 bento-card p-xl rounded-xl">
          <div className="flex items-center gap-lg mb-xl">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-surface-container">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Profile" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuChOpXi8pn5buKps7OWwbYb4RZ9jTdDOgcC2x2f5v5Oy-N11PIX_7zVj1Iw44-aZaQmNYiAeUy4vAY3NNgkGBwuqmokLl68RE7G-oczSjL6c9p5a6vV3rQ_ydfZNGkNl5Yi8AqtJ2EYJhpwVB03Scv5X78_0L_8S_b4mCxxrtNMVfslh2Gy2n3U6t1Y09gBpyscB4jo90qPIgP2GQT7_hfNIbzc8MeRwyzyOmSpNQMhrMII06EEQBpdYKnjuY37YevPyKYgWFknhXo" 
                />
              </div>
              <div className="absolute inset-0 bg-on-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <span className="material-symbols-outlined text-surface">photo_camera</span>
              </div>
            </div>
            <div>
              <h3 className="font-h3 text-h3">Personal Information</h3>
              <p className="text-body-sm text-on-surface-variant">Update your photo and personal details.</p>
              <button className="mt-sm text-primary font-label-md flex items-center gap-xs hover:underline">
                Upload new photo
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="space-y-xs group">
              <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">First Name</label>
                <input 
                  className="w-full h-10 px-md border border-outline-variant rounded bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all group-focus-within:scale-[1.01]" 
                  type="text" 
                  value={profile?.name?.split(' ')[0] || ''}
                  onChange={(e) => setProfile(p => p ? { ...p, name: e.target.value + ' ' + (p.name?.split(' ').slice(1).join(' ') || '') } : p)}
                />
              </div>
              <div className="space-y-xs group">
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">Last Name</label>
                <input 
                  className="w-full h-10 px-md border border-outline-variant rounded bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all group-focus-within:scale-[1.01]" 
                  type="text" 
                  value={profile?.name?.split(' ').slice(1).join(' ') || ''}
                  onChange={(e) => setProfile(p => p ? { ...p, name: (p.name?.split(' ')[0] || '') + ' ' + e.target.value } : p)}
                />
              </div>
              <div className="md:col-span-2 space-y-xs group">
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <input 
                    className="w-full h-10 pl-md pr-xl border border-outline-variant rounded bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all group-focus-within:scale-[1.01]" 
                    type="email" 
                    value={profile?.email || ''}
                    onChange={(e) => setProfile(p => p ? { ...p, email: e.target.value } : p)}
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2 text-primary text-[18px]">verified</span>
                </div>
              </div>
            </div>
            <div className="mt-xl flex justify-end">
              <button onClick={handleSave} disabled={saving} className="px-xl py-sm bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary-container transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
        </section>
      </div>

      <footer className="mt-2xl text-center text-label-sm text-on-surface-variant/60">
        © 2024 CarrierGuard AI • Enterprise Security • Privacy Policy
      </footer>
    </div>
  );
}
