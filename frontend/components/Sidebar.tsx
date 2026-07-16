"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, SignOutButton } from '@clerk/nextjs';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Search', path: '/search', icon: 'search' },
    { name: 'History', path: '/history', icon: 'history' },
    { name: 'Notifications', path: '/notifications', icon: 'notifications' },
  ];

  const bottomItems = [
    { name: 'Settings', path: '/settings', icon: 'settings' },
    { name: 'Billing', path: '/billing', icon: 'payments' },
  ];

  const getLinkClasses = (path: string) => {
    const isActive = path === '/carrier'
      ? pathname.startsWith(path)
      : pathname === path;
    if (isActive) {
      return "flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 ease-in-out text-primary dark:text-primary-fixed font-bold border-r-2 border-primary dark:border-primary-fixed bg-surface-container";
    }
    return "flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 ease-in-out text-on-secondary-fixed-variant dark:text-secondary-fixed-dim hover:bg-surface-container dark:hover:bg-on-surface-variant/10";
  };

  return (
    <aside className="w-[280px] h-screen sticky top-0 left-0 bg-surface dark:bg-inverse-surface border-r border-outline-variant dark:border-outline flex flex-col py-lg px-md z-50">
      <div className="flex items-center gap-md mb-3xl">
        <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
          <span className="material-symbols-outlined">shield</span>
        </div>
        <div>
          <h1 className="font-h2 text-h2 font-bold text-primary dark:text-primary-fixed leading-none">CarrierGuard AI</h1>
          <p className="text-on-secondary-container font-label-sm uppercase tracking-wider mt-1">Enterprise Vetting</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path} className={getLinkClasses(item.path)}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-body-md">{item.name}</span>
          </Link>
        ))}
      </nav>
      
      <div className="pt-xl border-t border-outline-variant space-y-1">
        {bottomItems.map((item) => (
          <Link key={item.path} href={item.path} className={getLinkClasses(item.path)}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-body-md">{item.name}</span>
          </Link>
        ))}
        
        {isLoaded && user && (
          <div className="mt-xl block">
            <SignOutButton>
              <button className="w-full flex items-center gap-md p-md bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors text-left">
                <img
                  className="w-10 h-10 rounded-full border border-outline-variant object-cover"
                  alt={user.fullName || 'User'}
                  src={user.imageUrl}
                />
                <div className="overflow-hidden flex-1">
                  <p className="font-label-md text-on-surface truncate">{user.fullName || 'User'}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user.primaryEmailAddress?.emailAddress || ''}</p>
                </div>
                <span className="material-symbols-outlined text-outline text-sm">logout</span>
              </button>
            </SignOutButton>
          </div>
        )}
      </div>
    </aside>
  );
}
