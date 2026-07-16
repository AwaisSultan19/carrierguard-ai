"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getOrganization, getOrgMembers, type Organization, type OrgMember } from '@/lib/api';

type TabId = 'general' | 'members' | 'api' | 'security';

export default function SettingsPage() {
  const { getToken } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('general');

  useEffect(() => {
    getToken().then(async (token) => {
      const [o, m] = await Promise.all([getOrganization(token), getOrgMembers(token)]);
      setOrg(o);
      setMembers(m || []);
    });
  }, [getToken]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'members', label: 'Members' },
    { id: 'api', label: 'API Keys' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-gutter max-w-5xl mx-auto w-full space-y-xl">
        {/* Page Header */}
        <div className="space-y-xs">
          <h2 className="font-h2 text-h2 text-on-surface">Global Configuration</h2>
          <p className="font-body-md text-on-surface-variant">Manage your organization's identity, team access, and developer credentials.</p>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-outline-variant flex gap-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-md font-label-md text-label-md transition-all px-xs ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary -mb-px'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content: General */}
        {activeTab === 'general' && (
          <section className="space-y-lg">
            <div className="settings-card rounded-xl p-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
                <div className="space-y-sm">
                  <h3 className="font-h3 text-h3 text-on-surface">Organization Identity</h3>
                  <p className="font-body-sm text-on-surface-variant">Update your company branding and primary domain details.</p>
                </div>
                <div className="md:col-span-2 space-y-lg">
                  <div className="space-y-xs">
                    <label className="font-label-sm text-label-sm text-on-surface block">Organization Name</label>
                    <input 
                      className="w-full border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none transition-all" 
                      type="text" 
                      value={org?.name || 'CarrierGuard AI Global'}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="space-y-xs">
                    <label className="font-label-sm text-label-sm text-on-surface block">Organization Logo</label>
                    <div className="flex items-center gap-xl mt-sm">
                      <div className="w-20 h-20 rounded-xl bg-surface-container-high flex items-center justify-center border-2 border-dashed border-outline-variant">
                        <span className="material-symbols-outlined text-outline text-3xl">upload_file</span>
                      </div>
                      <div className="space-y-sm">
                        <button className="bg-primary text-white font-label-md text-label-md px-lg py-sm rounded-lg hover:opacity-90 transition-opacity">Upload New Logo</button>
                        <p className="text-[12px] text-on-surface-variant">Square aspect ratio recommended. PNG, SVG up to 2MB.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-xs">
                    <label className="font-label-sm text-label-sm text-on-surface block">Primary Domain</label>
                    <div className="flex gap-sm">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline font-label-sm">https://</span>
                        <input 
                          className="w-full pl-[56px] border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none" 
                          type="text" 
                          value={org?.domain || ''}
                          onChange={() => {}}
                        />
                      </div>
                      <button className="border border-outline-variant px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-container-low">Verify</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-md">
              <button className="px-lg py-sm font-label-md text-label-md border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors">Discard Changes</button>
              <button className="px-xl py-sm font-label-md text-label-md bg-primary text-white rounded-lg hover:opacity-90 shadow-sm transition-opacity">Save Profile</button>
            </div>
          </section>
        )}

        {/* Tab Content: Members */}
        {activeTab === 'members' && (
          <section className="space-y-lg">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="font-h3 text-h3 text-on-surface">Team Management</h3>
                <p className="font-body-sm text-on-surface-variant">Control access levels for all organization users.</p>
              </div>
              <button className="bg-primary text-white font-label-md text-label-md px-lg py-sm rounded-lg flex items-center gap-xs hover:opacity-90 transition-opacity shadow-sm">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Invite Member
              </button>
            </div>
            <div className="settings-card rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Member</th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Email Address</th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Role</th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-md">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-[12px]">AS</div>
                        <span className="font-body-md text-body-md text-on-surface">Alex Sterling</span>
                      </div>
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant">alex@carrierguard.ai</td>
                    <td className="px-lg py-md">
                      <span className="bg-primary-container/10 text-primary px-sm py-xs rounded text-[11px] font-bold uppercase">Admin</span>
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-body-sm">Active</span>
                      </div>
                    </td>
                    <td className="px-lg py-md text-right">
                      <span className="material-symbols-outlined text-outline cursor-pointer hover:text-on-surface">more_vert</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-md">
                        <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-[12px]">JD</div>
                        <span className="font-body-md text-body-md text-on-surface">Jordan Dax</span>
                      </div>
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant">j.dax@carrierguard.ai</td>
                    <td className="px-lg py-md">
                      <span className="bg-surface-container-highest text-on-surface-variant px-sm py-xs rounded text-[11px] font-bold uppercase">Member</span>
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-body-sm">Active</span>
                      </div>
                    </td>
                    <td className="px-lg py-md text-right">
                      <span className="material-symbols-outlined text-outline cursor-pointer hover:text-on-surface">more_vert</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-md">
                        <div className="w-8 h-8 rounded-full bg-surface-container text-outline flex items-center justify-center font-bold text-[12px]">??</div>
                        <span className="font-body-md text-body-md text-on-surface">Sarah Chen</span>
                      </div>
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant">s.chen@carrierguard.ai</td>
                    <td className="px-lg py-md">
                      <span className="bg-surface-container-highest text-on-surface-variant px-sm py-xs rounded text-[11px] font-bold uppercase">Member</span>
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-xs">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-body-sm">Pending</span>
                      </div>
                    </td>
                    <td className="px-lg py-md text-right">
                      <span className="material-symbols-outlined text-outline cursor-pointer hover:text-on-surface">more_vert</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab Content: API Keys */}
        {activeTab === 'api' && (
          <section className="space-y-lg">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="font-h3 text-h3 text-on-surface">API Credentials</h3>
                <p className="font-body-sm text-on-surface-variant">Secure access tokens for integrating CarrierGuard AI into your own systems.</p>
              </div>
              <button className="bg-primary text-white font-label-md text-label-md px-lg py-sm rounded-lg flex items-center gap-xs hover:opacity-90 transition-opacity shadow-sm">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Generate New Key
              </button>
            </div>
            <div className="grid grid-cols-1 gap-md">
              {/* API Key Item 1 */}
              <div className="settings-card rounded-xl p-lg flex flex-col md:flex-row md:items-center justify-between gap-md">
                <div className="space-y-xs">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary text-[20px]">key</span>
                    <h4 className="font-label-md text-label-md text-on-surface font-bold">Production_Endpoint_A</h4>
                    <span className="bg-green-100 text-green-700 text-[10px] px-sm py-xs rounded-full font-bold">ACTIVE</span>
                  </div>
                  <code className="text-xs font-mono bg-surface-container-low px-sm py-1 rounded text-on-surface-variant">sk_live_51M...xxxx...9y2Z</code>
                </div>
                <div className="flex items-center gap-md">
                  <div className="text-right">
                    <p className="text-[11px] text-on-surface-variant uppercase font-bold">Last Used</p>
                    <p className="text-label-sm font-label-sm">2 mins ago</p>
                  </div>
                  <div className="h-8 w-[1px] bg-outline-variant mx-sm hidden md:block"></div>
                  <button className="text-error font-label-md text-label-md hover:bg-error/5 px-md py-sm rounded-lg transition-colors">Revoke</button>
                </div>
              </div>
              {/* API Key Item 2 */}
              <div className="settings-card rounded-xl p-lg flex flex-col md:flex-row md:items-center justify-between gap-md">
                <div className="space-y-xs">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-outline text-[20px]">key</span>
                    <h4 className="font-label-md text-label-md text-on-surface font-bold">Staging_Test_Env</h4>
                    <span className="bg-surface-container-high text-on-surface-variant text-[10px] px-sm py-xs rounded-full font-bold">INACTIVE</span>
                  </div>
                  <code className="text-xs font-mono bg-surface-container-low px-sm py-1 rounded text-on-surface-variant">sk_test_51K...xxxx...2j8L</code>
                </div>
                <div className="flex items-center gap-md">
                  <div className="text-right">
                    <p className="text-[11px] text-on-surface-variant uppercase font-bold">Last Used</p>
                    <p className="text-label-sm font-label-sm">Oct 24, 2023</p>
                  </div>
                  <div className="h-8 w-[1px] bg-outline-variant mx-sm hidden md:block"></div>
                  <button className="text-primary font-label-md text-label-md hover:bg-primary/5 px-md py-sm rounded-lg transition-colors">Activate</button>
                </div>
              </div>
            </div>
            <div className="bg-primary-container/5 border border-primary-container/20 rounded-xl p-lg flex gap-lg">
              <span className="material-symbols-outlined text-primary">info</span>
              <div className="space-y-xs">
                <h4 className="font-label-md text-label-md text-on-primary-fixed-variant font-bold">Security Best Practices</h4>
                <p className="font-body-sm text-on-surface-variant">Never share your API keys in publicly accessible areas such as GitHub or client-side code. If you suspect a key is compromised, revoke it immediately.</p>
              </div>
            </div>
          </section>
        )}

        {/* Tab Content: Security */}
        {activeTab === 'security' && (
          <section className="space-y-lg">
            <div className="settings-card rounded-xl divide-y divide-outline-variant">
              <div className="p-xl flex items-center justify-between gap-xl">
                <div className="space-y-xs">
                  <h4 className="font-label-md text-label-md font-bold text-on-surface">Two-Factor Authentication</h4>
                  <p className="font-body-sm text-on-surface-variant">Require a second authentication step for all organization members.</p>
                </div>
                <label className="custom-toggle">
                  <input defaultChecked type="checkbox" />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="p-xl flex items-center justify-between gap-xl">
                <div className="space-y-xs">
                  <h4 className="font-label-md text-label-md font-bold text-on-surface">Single Sign-On (SSO)</h4>
                  <p className="font-body-sm text-on-surface-variant">Connect your organization to Okta, Azure AD, or Google Workspace.</p>
                </div>
                <button className="border border-outline-variant px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors">Configure SSO</button>
              </div>
              <div className="p-xl flex items-center justify-between gap-xl">
                <div className="space-y-xs">
                  <h4 className="font-label-md text-label-md font-bold text-on-surface">Session Timeout</h4>
                  <p className="font-body-sm text-on-surface-variant">Automatically log out inactive users after a set period.</p>
                </div>
                <select className="border border-outline-variant rounded-lg px-md py-sm bg-white font-label-md text-label-md outline-none focus:ring-2 focus:ring-primary">
                  <option>30 Minutes</option>
                  <option>1 Hour</option>
                  <option defaultValue="">4 Hours</option>
                  <option>8 Hours</option>
                  <option>Never</option>
                </select>
              </div>
            </div>
            <div className="border border-error/20 bg-error-container/20 rounded-xl p-xl space-y-md">
              <h4 className="font-label-md text-label-md font-bold text-error">Danger Zone</h4>
              <p className="font-body-sm text-on-surface-variant">Permanently delete this organization and all associated data. This action cannot be undone.</p>
              <button className="bg-error text-white font-label-md text-label-md px-lg py-sm rounded-lg hover:opacity-90 transition-opacity">Delete Organization</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
