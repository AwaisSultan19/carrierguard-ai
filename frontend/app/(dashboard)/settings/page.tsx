"use client";

import React, { useState } from 'react';

export default function SettingsPage() {
  const [orgName, setOrgName] = useState('CarrierGuard AI Global');

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-gutter max-w-5xl mx-auto w-full space-y-xl">
        <div className="space-y-xs">
          <h2 className="font-h2 text-h2 text-on-surface">Settings</h2>
          <p className="font-body-md text-on-surface-variant">Manage your organization.</p>
        </div>

        <section className="settings-card rounded-xl p-xl">
          <div className="space-y-lg">
            <div className="space-y-xs">
              <label className="font-label-sm text-label-sm text-on-surface block">Organization Name</label>
              <input 
                className="w-full border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none transition-all" 
                type="text" 
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-xl flex justify-end">
            <button className="px-xl py-sm font-label-md text-label-md bg-primary text-white rounded-lg hover:opacity-90 shadow-sm transition-opacity">Save</button>
          </div>
        </section>
      </div>
    </div>
  );
}
