/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */
import React from 'react';
import { useOS } from '@/contexts/OSContext';
import WindowManager from './WindowManager';
import Taskbar from './Taskbar';
import StartMenu from './StartMenu';
import DesktopIcons from './DesktopIcons';

const Desktop: React.FC = () => {
  const { isBasicView, isStartMenuOpen, closeStartMenu } = useOS();

  // ── Basic View: server/kiosk shell ─────────────────────────────────────────
  // Pure black background, no wallpaper, no desktop icons.
  // The Terminal window runs maximised and covers the full viewport.
  // A minimal slim status bar is kept at the bottom so the user can still
  // open other windows if needed (e.g. settings), but it is visually muted.
  if (isBasicView) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#0a0a0a',
          overflow: 'hidden',
        }}
      >
        {/* All open windows (Terminal will be maximised and cover everything) */}
        <WindowManager />

        {/* Start menu overlay — still available via keyboard or system calls */}
        {isStartMenuOpen && <StartMenu />}

        {/* Slim status bar — muted, unobtrusive */}
        <Taskbar />
      </div>
    );
  }

  // ── Full graphical desktop (future / non-basic mode) ───────────────────────
  return (
    <div className="fixed inset-0 bg-desktop overflow-hidden select-none">
      {/* Desktop Icons Area */}
      <div className="absolute inset-0 bottom-14 p-4" onClick={closeStartMenu}>
        <DesktopIcons />
      </div>

      <WindowManager />

      {isStartMenuOpen && <StartMenu />}

      <Taskbar />
    </div>
  );
};

export default Desktop;
