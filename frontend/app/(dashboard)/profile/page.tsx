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
    <div className="px-6 py-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">User Profile</h1>
        <p className="text-sm text-gray-400">Manage your personal information.</p>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Personal Info Card (7 Cols) */}
        <section className="lg:col-span-7 bg-gray-900/60 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-gray-800">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Profile" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuChOpXi8pn5buKps7OWwbYb4RZ9jTdDOgcC2x2f5v5Oy-N11PIX_7zVj1Iw44-aZaQmNYiAeUy4vAY3NNgkGBwuqmokLl68RE7G-oczSjL6c9p5a6vV3rQ_ydfZNGkNl5Yi8AqtJ2EYJhpwVB03Scv5X78_0L_8S_b4mCxxrtNMVfslh2Gy2n3U6t1Y09gBpyscB4jo90qPIgP2GQT7_hfNIbzc8MeRwyzyOmSpNQMhrMII06EEQBpdYKnjuY37YevPyKYgWFknhXo" 
                />
              </div>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <span className="material-symbols-outlined text-white">photo_camera</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-100">Personal Information</h3>
              <p className="text-sm text-gray-400">Update your photo and personal details.</p>
              <button className="mt-1 text-orange-400 text-xs font-medium flex items-center gap-1 hover:underline">
                Upload new photo
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1 group">
              <label className="text-[11px] text-gray-400 uppercase tracking-wider">First Name</label>
                <input 
                  className="w-full h-10 px-3 bg-gray-900/80 border border-gray-700 text-gray-100 placeholder:text-gray-500 rounded focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all group-focus-within:scale-[1.01]" 
                  type="text" 
                  value={profile?.name?.split(' ')[0] || ''}
                  onChange={(e) => setProfile(p => p ? { ...p, name: e.target.value + ' ' + (p.name?.split(' ').slice(1).join(' ') || '') } : p)}
                />
              </div>
              <div className="space-y-1 group">
                <label className="text-[11px] text-gray-400 uppercase tracking-wider">Last Name</label>
                <input 
                  className="w-full h-10 px-3 bg-gray-900/80 border border-gray-700 text-gray-100 placeholder:text-gray-500 rounded focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all group-focus-within:scale-[1.01]" 
                  type="text" 
                  value={profile?.name?.split(' ').slice(1).join(' ') || ''}
                  onChange={(e) => setProfile(p => p ? { ...p, name: (p.name?.split(' ')[0] || '') + ' ' + e.target.value } : p)}
                />
              </div>
              <div className="md:col-span-2 space-y-1 group">
                <label className="text-[11px] text-gray-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <input 
                    className="w-full h-10 pl-3 pr-6 bg-gray-900/80 border border-gray-700 text-gray-100 placeholder:text-gray-500 rounded focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all group-focus-within:scale-[1.01]" 
                    type="email" 
                    value={profile?.email || ''}
                    onChange={(e) => setProfile(p => p ? { ...p, email: e.target.value } : p)}
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2 text-orange-400 text-[18px]">verified</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={handleSave} disabled={saving} className="px-6 py-1.5 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
        </section>
      </div>

      <footer className="mt-12 text-center text-[11px] text-gray-500">
        © 2024 CarrierGuard AI • Enterprise Security • Privacy Policy
      </footer>
    </div>
  );
}
