/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */
import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '@/contexts/OSContext';
import { Window as WindowType } from '@/types/os';
import { X, Minus, Square, Maximize2 } from 'lucide-react';

interface WindowProps {
  window: WindowType;
  children: React.ReactNode;
}

const Window: React.FC<WindowProps> = ({ window, children }) => {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    isBasicView,
  } = useOS();

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).closest('.window-header')
    ) {
      focusWindow(window.id);
      if (
        (e.target as HTMLElement).closest('.window-header') &&
        !(e.target as HTMLElement).closest('button')
      ) {
        setIsDragging(true);
        setDragOffset({
          x: e.clientX - window.position.x,
          y: e.clientY - window.position.y,
        });
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !window.isMaximized) {
        updateWindowPosition(window.id, {
          x: Math.max(0, e.clientX - dragOffset.x),
          y: Math.max(0, e.clientY - dragOffset.y),
        });
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, window.id, window.isMaximized, updateWindowPosition]);

  // ── Layout ──────────────────────────────────────────────────────────────────

  const windowStyles: React.CSSProperties = (() => {
    if (window.isMaximized) {
      if (isBasicView) {
        // Full-screen: cover the entire viewport, no taskbar gap
        return {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: window.zIndex,
        };
      }
      // Normal maximized: leave room for the 56px taskbar
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 56,
        width: '100%',
        height: 'calc(100% - 56px)',
        zIndex: window.zIndex,
      };
    }
    // Floating window
    return {
      position: 'absolute',
      top: window.position.y,
      left: window.position.x,
      width: window.size.width,
      height: window.size.height,
      zIndex: window.zIndex,
    };
  })();

  // In Basic View we hide the titlebar on maximised windows so the terminal
  // truly feels like a full-screen SSH session.
  const hideTitlebar = isBasicView && window.isMaximized;

  return (
    <div
      ref={windowRef}
      className={`window-glass flex flex-col overflow-hidden animate-window-open ${
        window.isFocused ? 'ring-1 ring-primary/50' : ''
      }`}
      style={windowStyles}
      onMouseDown={handleMouseDown}
    >
      {/* Window Header — hidden in full-screen Basic View */}
      {!hideTitlebar && (
        <div className="window-header flex items-center justify-between h-10 px-3 bg-window-header border-b border-border cursor-move shrink-0">
          <span className="text-sm font-medium text-foreground truncate">{window.title}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => minimizeWindow(window.id)}
              className="p-1.5 rounded hover:bg-secondary/50 transition-colors"
            >
              <Minus className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => maximizeWindow(window.id)}
              className="p-1.5 rounded hover:bg-secondary/50 transition-colors"
            >
              {window.isMaximized ? (
                <Square className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={() => closeWindow(window.id)}
              className="p-1.5 rounded hover:bg-destructive/50 transition-colors group"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive" />
            </button>
          </div>
        </div>
      )}

      {/* Window Content */}
      <div className="flex-1 overflow-auto bg-card">{children}</div>
    </div>
  );
};

export default Window;
