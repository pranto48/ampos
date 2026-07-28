/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Window, User } from '@/types/os';

// ─── Phase ────────────────────────────────────────────────────────────────────

export type OsPhase = 'booting' | 'logging_in' | 'desktop';

// ─── Context shape ────────────────────────────────────────────────────────────

interface OSContextType {
  // Phase
  phase: OsPhase;
  setPhase: (phase: OsPhase) => void;

  // View mode
  isBasicView: boolean;

  // Windows
  windows: Window[];
  activeWindowId: string | null;

  // Auth
  user: User | null;
  isLocked: boolean;

  // UI state
  isStartMenuOpen: boolean;

  // Window actions
  openWindow: (id: string, title: string, icon: string, component: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;

  // Auth actions
  login: (username: string, password: string) => boolean;
  logout: () => void;

  // Menu actions
  toggleStartMenu: () => void;
  closeStartMenu: () => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

let zIndexCounter = 100;

// ─── Provider ─────────────────────────────────────────────────────────────────

export const OSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<OsPhase>('booting');
  const [windows, setWindows] = useState<Window[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

  // Basic View is always active — the OS is designed as a server/kiosk shell
  const isBasicView = true;

  // ── Window helpers ──────────────────────────────────────────────────────────

  /** Opens a window. Pass maximized=true to start it maximised. */
  const openWindow = useCallback(
    (id: string, title: string, icon: string, component: string, maximized = false) => {
      setWindows((prev) => {
        const existing = prev.find((w) => w.id === id);
        if (existing) {
          if (existing.isMinimized) {
            return prev.map((w) =>
              w.id === id
                ? { ...w, isMinimized: false, isFocused: true, zIndex: ++zIndexCounter }
                : { ...w, isFocused: false }
            );
          }
          return prev.map((w) =>
            w.id === id
              ? { ...w, isFocused: true, zIndex: ++zIndexCounter }
              : { ...w, isFocused: false }
          );
        }
        const newWindow: Window = {
          id,
          title,
          icon,
          component,
          isMinimized: false,
          isMaximized: maximized,
          isFocused: true,
          position: { x: 100 + prev.length * 30, y: 100 + prev.length * 30 },
          size: { width: 900, height: 600 },
          zIndex: ++zIndexCounter,
        };
        return [...prev.map((w) => ({ ...w, isFocused: false })), newWindow];
      });
      setActiveWindowId(id);
      setIsStartMenuOpen(false);
    },
    []
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindowId((prevId) => (prevId === id ? null : prevId));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true, isFocused: false } : w))
    );
    setActiveWindowId(null);
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, isFocused: true, isMinimized: false, zIndex: ++zIndexCounter }
          : { ...w, isFocused: false }
      )
    );
    setActiveWindowId(id);
  }, []);

  const updateWindowPosition = useCallback((id: string, position: { x: number; y: number }) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, position } : w)));
  }, []);

  const updateWindowSize = useCallback((id: string, size: { width: number; height: number }) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w)));
  }, []);

  // ── Auth ────────────────────────────────────────────────────────────────────

  const login = useCallback(
    (username: string, password: string): boolean => {
      // Demo credentials — replace with real auth in production
      if (username === 'admin' && password === 'admin') {
        setUser({
          id: '1',
          username: 'admin',
          email: 'admin@itsupport.com.bd',
          role: 'admin',
        });
        setIsLocked(false);

        // Transition to the desktop phase
        setPhase('desktop');

        // Automatically launch Terminal maximised (Basic View server shell)
        setTimeout(() => {
          openWindow('terminal', 'Terminal', '💻', 'Terminal', true);
        }, 50);

        return true;
      }
      return false;
    },
    [openWindow]
  );

  const logout = useCallback(() => {
    setUser(null);
    setIsLocked(true);
    setWindows([]);
    setIsStartMenuOpen(false);
    setPhase('logging_in');
  }, []);

  // ── Menu ────────────────────────────────────────────────────────────────────

  const toggleStartMenu = useCallback(() => {
    setIsStartMenuOpen((prev) => !prev);
  }, []);

  const closeStartMenu = useCallback(() => {
    setIsStartMenuOpen(false);
  }, []);

  return (
    <OSContext.Provider
      value={{
        phase,
        setPhase,
        isBasicView,
        windows,
        activeWindowId,
        user,
        isLocked,
        isStartMenuOpen,
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
        login,
        logout,
        toggleStartMenu,
        closeStartMenu,
      }}
    >
      {children}
    </OSContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useOS = () => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};
