"use client";

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

const APP_LOCAL_STORAGE_KEYS = ['cg_free_searches'];

function clearAppLocalStorage() {
  for (const key of APP_LOCAL_STORAGE_KEYS) {
    try { localStorage.removeItem(key); } catch {}
  }
}

export default function SessionCleanup() {
  const { userId } = useAuth();
  const prevUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (prevUserId.current === undefined) {
      prevUserId.current = userId;
      return;
    }

    if (userId !== prevUserId.current) {
      clearAppLocalStorage();
      prevUserId.current = userId;
    }
  }, [userId]);

  return null;
}
