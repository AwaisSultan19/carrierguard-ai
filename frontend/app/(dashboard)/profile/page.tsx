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
        <p className="text-body-md text-on-surface-variant">Manage your personal information, security, and application preferences.</p>
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

        {/* Security Section (5 Cols) */}
        <section className="lg:col-span-5 bento-card p-xl rounded-xl flex flex-col">
          <div className="flex items-start justify-between mb-lg">
            <div>
              <h3 className="font-h3 text-h3 flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">shield</span>
                Security
              </h3>
              <p className="text-body-sm text-on-surface-variant">Protect your enterprise account.</p>
            </div>
          </div>
          
          <div className="space-y-lg flex-1">
            <div className="p-md rounded-lg bg-surface-container-low border border-outline-variant">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label-md">Password</p>
                  <p className="text-label-sm text-on-surface-variant">Last changed 4 months ago</p>
                </div>
                <button className="px-md py-xs border border-outline-variant rounded-md text-label-sm hover:bg-surface-container-high transition-colors">Update</button>
              </div>
            </div>
            
            <div className="p-md rounded-lg bg-surface-container-low border border-outline-variant">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label-md">Two-Factor Auth</p>
                  <p className="text-label-sm text-on-surface-variant">Secure your login with SMS or App</p>
                </div>
                <label className="custom-toggle">
                  <input defaultChecked type="checkbox" onChange={(e) => console.log('2FA ' + (e.target.checked ? 'enabled' : 'disabled'))} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
            
            <div className="mt-auto pt-lg">
              <p className="text-label-sm text-on-surface-variant mb-sm">Active Sessions</p>
              <div className="flex items-center gap-md text-body-sm">
                <span className="material-symbols-outlined text-on-surface-variant">desktop_windows</span>
                <div className="flex-1">
                  <p>MacBook Pro - San Francisco, US</p>
                  <p className="text-xs text-on-secondary-container">Active Now</p>
                </div>
                <button className="text-error font-label-sm">Logout</button>
              </div>
            </div>
          </div>
        </section>

        {/* Preferences & Localisation (Full Width) */}
        <section className="lg:col-span-12 bento-card p-xl rounded-xl">
          <h3 className="font-h3 text-h3 mb-xl">Application Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
            {/* Notifications */}
            <div className="space-y-md">
              <p className="font-label-md text-primary uppercase tracking-widest text-[11px]">Notifications</p>
              <div className="space-y-sm">
                <label className="flex items-center gap-md cursor-pointer group">
                  <input defaultChecked className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
                  <span className="text-body-md group-hover:text-primary transition-colors">Email Alerts</span>
                </label>
                <label className="flex items-center gap-md cursor-pointer group">
                  <input defaultChecked className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
                  <span className="text-body-md group-hover:text-primary transition-colors">Push Notifications</span>
                </label>
                <label className="flex items-center gap-md cursor-pointer group">
                  <input className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
                  <span className="text-body-md group-hover:text-primary transition-colors">Desktop Banners</span>
                </label>
              </div>
            </div>
            
            {/* Localization */}
            <div className="space-y-md">
              <p className="font-label-md text-primary uppercase tracking-widest text-[11px]">Regional</p>
              <div className="space-y-sm">
                <div className="space-y-xs group">
                  <label className="text-label-sm text-on-surface-variant">Language</label>
                  <select className="w-full h-10 px-md border border-outline-variant rounded bg-surface focus:ring-primary group-focus-within:scale-[1.01] transition-transform">
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>German</option>
                    <option>French</option>
                  </select>
                </div>
                <div className="space-y-xs group">
                  <label className="text-label-sm text-on-surface-variant">Timezone</label>
                  <select className="w-full h-10 px-md border border-outline-variant rounded bg-surface focus:ring-primary group-focus-within:scale-[1.01] transition-transform">
                    <option>(GMT-08:00) Pacific Time</option>
                    <option>(GMT-05:00) Eastern Time</option>
                    <option>(GMT+00:00) London</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Appearance */}
            <div className="space-y-md">
              <p className="font-label-md text-primary uppercase tracking-widest text-[11px]">Interface</p>
              <div className="p-md rounded-xl bg-surface-container-high/50 border border-outline-variant flex flex-col items-center justify-center gap-sm">
                <div className="w-full flex justify-between bg-surface p-xs rounded-lg border border-outline-variant">
                  <button className="flex-1 py-xs bg-primary text-on-primary rounded font-label-sm">Light</button>
                  <button className="flex-1 py-xs text-on-surface-variant font-label-sm">Dark</button>
                  <button className="flex-1 py-xs text-on-surface-variant font-label-sm">System</button>
                </div>
                <p className="text-label-sm text-on-surface-variant text-center">Set your preferred display mode.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone (Full Width) */}
        <section className="lg:col-span-12 border border-error/20 bg-error-container/20 p-xl rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div>
            <h4 className="font-h3 text-h3 text-error">Deactivate Account</h4>
            <p className="text-body-sm text-on-surface-variant">Once you deactivate your account, there is no going back. Please be certain.</p>
          </div>
          <button className="px-xl py-sm bg-error text-white rounded-lg font-label-md hover:bg-error/90 transition-colors">
            Deactivate Account
          </button>
        </section>
      </div>

      <footer className="mt-2xl text-center text-label-sm text-on-surface-variant/60">
        © 2024 CarrierGuard AI • Enterprise Security • Privacy Policy
      </footer>
    </div>
  );
}
