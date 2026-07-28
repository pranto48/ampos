/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useOS } from '@/contexts/OSContext';
import { getSetupConfig, getEffectiveNetwork } from '@/services/setupConfigService';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'username' | 'password' | 'authenticating' | 'failed';

interface TerminalLine {
  id: number;
  text: string;
  color?: 'white' | 'green' | 'red' | 'dim';
}

// ─── Config (resolved once at module load; stable for the lifetime of the screen) ───

const _cfg  = getSetupConfig();
const _net  = getEffectiveNetwork(_cfg);

const HOSTNAME = _cfg.hostname;

/** Header lines shown at the top of the TTY screen. */
const OS_HEADER = [
  `AmPOS Linux Server - Web Edition (IP: ${_net.ip})`,
  `Kernel 6.6.21-amd64 on an x86_64  |  Host: ${HOSTNAME}`,
  '',
] as const;

let lineId = 0;
const mkLine = (text: string, color?: TerminalLine['color']): TerminalLine => ({
  id: ++lineId,
  text,
  color,
});

// ─── Component ────────────────────────────────────────────────────────────────

const LoginScreen: React.FC = () => {
  const { login } = useOS();

  const [lines, setLines] = useState<TerminalLine[]>(() =>
    OS_HEADER.map((t) => mkLine(t, t.startsWith('AmPOS') ? 'green' : 'dim'))
  );
  const [phase, setPhase] = useState<Phase>('username');
  const [inputValue, setInputValue] = useState('');
  const [pendingUsername, setPendingUsername] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const appendLine = useCallback((text: string, color?: TerminalLine['color']) => {
    setLines((prev) => [...prev, mkLine(text, color)]);
  }, []);

  const focusInput = useCallback(() => {
    // Small delay so React finishes rendering the input before we focus
    setTimeout(() => inputRef.current?.focus(), 30);
  }, []);

  // ── Initial prompt ────────────────────────────────────────────────────────

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  // Auto-scroll to bottom whenever lines change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [lines]);

  // Re-focus whenever the phase changes (e.g., after "Login incorrect")
  useEffect(() => {
    if (phase !== 'authenticating') focusInput();
  }, [phase, focusInput]);

  // ── Keyboard handler ──────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();

      const value = inputValue.trim();

      if (phase === 'username') {
        // Echo the username the user typed
        appendLine(`${HOSTNAME} login: ${value}`);
        if (!value) {
          // Empty username → loop back
          setInputValue('');
          return;
        }
        setPendingUsername(value);
        setInputValue('');
        setPhase('password');
        appendLine('Password: ');
      } else if (phase === 'password') {
        // Password is hidden — echo a blank line (just the prompt without chars)
        appendLine('');
        setPhase('authenticating');
        setInputValue('');

        // Small delay to simulate PAM / auth check
        await new Promise<void>((res) => setTimeout(res, 700));

        const success = login(pendingUsername, value);

        if (success) {
          appendLine('', 'dim');
          appendLine(`Last login: ${new Date().toDateString()} from tty1`, 'dim');
          appendLine('', 'dim');
          // onLogin is implicit — useOS().login sets isLocked=false, which
          // causes Index.tsx to unmount LoginScreen automatically.
        } else {
          appendLine('Login incorrect', 'red');
          appendLine('');
          setPendingUsername('');
          setInputValue('');
          setPhase('username');
        }
      }
    },
    [inputValue, phase, pendingUsername, login, appendLine]
  );

  // ── Render helpers ────────────────────────────────────────────────────────

  const promptPrefix =
    phase === 'username' || phase === 'failed'
      ? `${HOSTNAME} login: `
      : 'Password: ';

  // In password phase the visible input echoes nothing
  const displayValue = phase === 'password' || phase === 'authenticating' ? '' : inputValue;

  const lineColor: Record<NonNullable<TerminalLine['color']>, string> = {
    white: '#e5e5e5',
    green: '#4ade80',
    red: '#f87171',
    dim: '#6b7280',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#e5e5e5',
        padding: '20px 24px',
        overflowY: 'auto',
        cursor: 'text',
        userSelect: 'none',
      }}
      onClick={() => focusInput()}
    >
      {/* ── Past lines ─────────────────────────────────────────────────────── */}
      {lines.map((line) => (
        <div
          key={line.id}
          style={{ color: line.color ? lineColor[line.color] : '#e5e5e5', whiteSpace: 'pre-wrap' }}
        >
          {line.text || '\u00A0'}
        </div>
      ))}

      {/* ── Active input row ────────────────────────────────────────────────── */}
      {phase !== 'authenticating' && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ whiteSpace: 'pre' }}>{promptPrefix}</span>

          {/* Invisible real input captures keystrokes */}
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label={phase === 'password' ? 'Password' : 'Username'}
            style={{
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none',
              width: '1px',
              height: '1px',
            }}
          />

          {/* Visible echo text */}
          <span style={{ whiteSpace: 'pre', color: '#e5e5e5' }}>{displayValue}</span>

          {/* Blinking block cursor */}
          <span
            style={{
              display: 'inline-block',
              width: '9px',
              height: '1.1em',
              background: '#e5e5e5',
              verticalAlign: 'text-bottom',
              animation: 'tty-blink 1.1s step-end infinite',
              marginLeft: '1px',
            }}
          />
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />

      <style>{`
        @keyframes tty-blink {
          50% { opacity: 0; }
        }
        ::-webkit-scrollbar { width: 0; }
      `}</style>
    </div>
  );
};

export default LoginScreen;
