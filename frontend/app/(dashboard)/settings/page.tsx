"use client";

import React, { useState } from 'react';

export default function SettingsPage() {
  const [orgName, setOrgName] = useState('CarrierGuard AI Global');

  return (
    <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-gray-400 mt-1.5">Manage your organization.</p>
      </div>

      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Organization Name
            </label>
            <input
              className="w-full h-10 px-3.5 text-sm text-gray-100 placeholder:text-gray-500 bg-gray-900/80 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button className="h-10 px-5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-400 rounded-lg transition-all shadow-sm">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
