"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';

export default function TopNav() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/search')) return 'Carrier Search';
    if (pathname.startsWith('/history')) return 'Audit History';
    if (pathname.startsWith('/billing')) return 'Billing & Usage';
    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/profile')) return 'Profile';
    if (pathname.startsWith('/carrier')) return 'Carrier Details';
    if (pathname.startsWith('/risk-report')) return 'Risk Report';
    return 'CarrierGuard AI';
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Search', path: '/search', icon: 'search' },
    { name: 'History', path: '/history', icon: 'history' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <>
      <header className="h-16 w-full sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50 flex justify-between items-center px-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-800/50 transition-colors">
            <span className="material-symbols-outlined text-gray-300">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
          <h2 className="text-lg font-semibold text-white">{getPageTitle()}</h2>
          <div className="px-2.5 py-1 bg-orange-500/10 text-orange-400 rounded text-[10px] font-bold uppercase tracking-widest border border-orange-500/20">Enterprise</div>
        </div>
        <div className="flex items-center gap-2">
          {isLoaded && user ? (
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-8 h-8",
                },
              }}
            />
          ) : (
            <Link href="/sign-in" className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-400 transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">login</span>
              Sign In
            </Link>
          )}
        </div>
      </header>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed top-16 left-0 bottom-0 w-[280px] bg-gray-950 z-50 border-r border-gray-800 flex flex-col py-4 px-4 shadow-2xl lg:hidden">
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive ? 'text-orange-400 font-semibold bg-orange-500/10 border-r-2 border-orange-500' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}>
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
