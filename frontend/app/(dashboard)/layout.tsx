import React from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen flex">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-gray-950 overflow-y-auto">
        <TopNav />
        {children}
      </main>
    </div>
  );
}
