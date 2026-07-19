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
      <header className="h-16 w-full sticky top-0 z-40 bg-surface dark:bg-inverse-surface border-b border-outline-variant dark:border-outline shadow-sm flex justify-between items-center px-gutter">
        <div className="flex items-center gap-md">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden mr-sm w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
          <h2 className="font-h3 text-h3 font-semibold text-on-surface dark:text-inverse-on-surface">{getPageTitle()}</h2>
          <div className="px-sm py-xs bg-secondary-container text-on-secondary-container rounded text-[10px] font-bold uppercase tracking-widest">Enterprise</div>
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
            <Link href="/sign-in" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-lg hover:brightness-110 transition-all shadow-sm">
              <span className="material-symbols-outlined text-lg">login</span>
              Sign In
            </Link>
          )}
        </div>
      </header>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed top-16 left-0 bottom-0 w-[280px] bg-surface z-50 border-r border-outline-variant flex flex-col py-md px-md shadow-2xl lg:hidden">
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-md px-md py-sm rounded-lg transition-colors ${
                      isActive ? 'text-primary font-bold bg-surface-container border-r-2 border-primary' : 'text-on-surface-variant hover:bg-surface-container'
                    }`}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="font-body-md">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto pt-xl border-t border-outline-variant">
              {!isLoaded || !user ? (
                <Link href="/sign-in" onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center gap-md p-md bg-primary-container/30 rounded-xl text-primary font-semibold">
                  <span className="material-symbols-outlined">login</span>
                  Sign In
                </Link>
              ) : null}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
