/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOS } from '@/contexts/OSContext';
import {
  checkForUpdate,
  performUpdate,
  getInstalledSha,
  getVersionLabel,
  shortSha,
} from '@/services/amposUpdateService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TerminalLine {
  type: 'output' | 'input' | 'error' | 'info' | 'warn';
  content: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOSTNAME = 'ampos-srv';
const USERNAME = 'admin';
const PROMPT = `${USERNAME}@${HOSTNAME}:~$`;

// ─── Line factories ───────────────────────────────────────────────────────────

const out  = (content: string): TerminalLine => ({ type: 'output', content });
const err  = (content: string): TerminalLine => ({ type: 'error',  content });
const info = (content: string): TerminalLine => ({ type: 'info',   content });
const warn = (content: string): TerminalLine => ({ type: 'warn',   content });

// ─── Static MOTD (update hint injected dynamically after mount) ───────────────

const BASE_MOTD: TerminalLine[] = [
  info('AmPOS Linux Server - Web Edition  (GNU/Linux 6.6.21-amd64 x86_64)'),
  out(''),
  out(' * Documentation:  https://portal.itsupport.com.bd'),
  out(` * Version:        ${getVersionLabel()} [${shortSha(getInstalledSha())}]`),
  out(''),
  out(`Last login: ${new Date().toDateString()} from 192.168.1.1`),
  out(''),
];

// ─── Synchronous command map ──────────────────────────────────────────────────
// Async commands (check-update, ampos-update) are handled separately below.

type SyncCmdFn = (
  args: string[],
  ctx: { logout: () => void; setLines: React.Dispatch<React.SetStateAction<TerminalLine[]>> }
) => TerminalLine[];

const SYNC_COMMANDS: Record<string, SyncCmdFn> = {
  help: () => [
    out(''),
    info('Available commands:'),
    out('  help            Show this help message'),
    out('  clear           Clear the terminal'),
    out('  echo            Echo text to stdout'),
    out('  date            Print current date/time'),
    out('  whoami          Print current user'),
    out('  hostname        Print system hostname'),
    out('  uptime          Show system uptime'),
    out('  uname           Print kernel/OS info'),
    out('  ls              List directory contents'),
    out('  pwd             Print working directory'),
    out('  env             List environment variables'),
    out('  ps              Show running processes'),
    out('  df              Report disk usage'),
    out('  free            Display memory usage'),
    out('  neofetch        System info summary'),
    out('  check-update    Check for available OS updates'),
    out('  ampos-update    Download and install latest update'),
    out('  reboot          Reboot the session (re-login)'),
    out('  systemctl       Manage system services'),
    out('  logout          Log out of the session'),
    out('  exit            Alias for logout'),
    out(''),
  ],

  clear: (_args, { setLines }) => {
    setLines([]);
    return [];
  },

  echo: (args) => [out(args.join(' '))],
  date: () => [out(new Date().toString())],
  whoami: () => [out(USERNAME)],
  hostname: () => [out(HOSTNAME)],

  uptime: () => {
    const h = Math.floor(Math.random() * 48) + 1;
    const m = Math.floor(Math.random() * 60);
    return [out(` ${new Date().toTimeString().slice(0, 8)} up ${h}:${String(m).padStart(2, '0')},  1 user,  load average: 0.12, 0.08, 0.05`)];
  },

  uname: (args) => {
    const full = args.includes('-a') || args.includes('--all');
    return full
      ? [out('Linux ampos-srv 6.6.21-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.6.21-1 (2024-04-12) x86_64 GNU/Linux')]
      : [out('Linux')];
  },

  pwd: () => [out('/home/admin')],

  ls: (args) => {
    const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const entries = showAll
      ? ['.', '..', '.bash_history', '.bashrc', '.profile', 'Documents', 'Downloads', '.ssh', 'logs']
      : ['Documents', 'Downloads', 'logs'];
    return [out(entries.join('  '))];
  },

  env: () => [
    out('HOME=/home/admin'),
    out('USER=admin'),
    out(`HOSTNAME=${HOSTNAME}`),
    out('SHELL=/bin/bash'),
    out('TERM=xterm-256color'),
    out('LANG=en_US.UTF-8'),
    out('PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'),
  ],

  ps: () => [
    out('  PID TTY          TIME CMD'),
    out('    1 ?        00:00:01 systemd'),
    out('  412 ?        00:00:00 sshd'),
    out('  837 pts/0    00:00:00 bash'),
    out('  838 pts/0    00:00:00 ps'),
  ],

  df: () => [
    out('Filesystem      Size  Used Avail Use% Mounted on'),
    out('/dev/sda1       236G   18G  206G   8% /'),
    out('tmpfs           3.9G     0  3.9G   0% /dev/shm'),
    out('tmpfs           781M  1.2M  780M   1% /run'),
  ],

  free: () => [
    out('               total        used        free      shared  buff/cache   available'),
    out('Mem:         8156108     1284712     5423916       89340     1447480     6489328'),
    out('Swap:        2097148           0     2097148'),
  ],

  neofetch: () => [
    out(''),
    out(`        ██████████████         ${USERNAME}@${HOSTNAME}`),
    out('       ███          ███        ─────────────────────────────────'),
    out(`      ███  ████████  ███       OS:         AmPOS Linux 1.0`),
    out('      ███  ████████  ███       Kernel:     6.6.21-amd64'),
    out('      ███  ████████  ███       Shell:      AmPOS Terminal'),
    out('       ███          ███        CPU:        Intel Core i5-1135G7'),
    out(`        ██████████████         Version:    ${getVersionLabel()} [${shortSha(getInstalledSha())}]`),
    out(`                               Resolution: ${window.innerWidth}x${window.innerHeight}`),
    out(''),
  ],

  systemctl: (args) => {
    const sub = args[0] ?? '';
    const unit = args[1] ?? 'ampos';
    if (['start', 'stop', 'restart', 'status'].includes(sub)) {
      if (sub === 'status') {
        return [
          out(`● ${unit}.service - AmPOS Web Runtime`),
          out('     Loaded: loaded (/etc/systemd/system/ampos.service; enabled)'),
          out('     Active: active (running) since today'),
          out(`  Main PID: 837 (${unit})`),
        ];
      }
      return [info(`[  OK  ] ${sub.charAt(0).toUpperCase() + sub.slice(1)}ed ${unit}.service.`)];
    }
    return [err(`systemctl: unknown operation '${sub}'`)];
  },

  reboot: (_args, { logout }) => {
    setTimeout(logout, 800);
    return [
      out(''),
      info('Stopping AmPOS runtime...'),
      info('[  OK  ] Stopped AmPOS Web Runtime.'),
      info('[  OK  ] Reached target Reboot.'),
      out(''),
    ];
  },

  logout: (_args, { logout }) => {
    setTimeout(logout, 300);
    return [out('logout')];
  },

  exit: (_args, { logout }) => {
    setTimeout(logout, 300);
    return [out('logout')];
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const Terminal: React.FC = () => {
  const { logout } = useOS();

  const [lines, setLines] = useState<TerminalLine[]>(BASE_MOTD);
  const [currentInput, setCurrentInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  /** When true the input row is locked (async command running). */
  const [busy, setBusy] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // ── Auto-focus ──────────────────────────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Silent MOTD update check ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    checkForUpdate().then((info) => {
      if (cancelled) return;
      if (info.updateAvailable) {
        setLines((prev) => [
          ...prev,
          warn("⚡ System update available! Type 'ampos-update' to install."),
          out(''),
        ]);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // ── Async command runner ─────────────────────────────────────────────────────
  /** Appends a single line to the terminal output (used by async flows). */
  const appendLine = useCallback((line: TerminalLine) => {
    setLines((prev) => [...prev, line]);
  }, []);

  const runCheckUpdate = useCallback(async () => {
    setBusy(true);
    appendLine(info('Connecting to api.github.com...'));
    const vInfo = await checkForUpdate();

    if (vInfo.fetchError) {
      appendLine(err(`check-update: ${vInfo.fetchError}`));
    } else {
      const localLabel  = `${getVersionLabel()} [${vInfo.localShort}]`;
      const remoteLabel = vInfo.remoteFull
        ? `${getVersionLabel()}  [${vInfo.remoteShort}]`
        : 'unknown';

      appendLine(out(`Current: ${localLabel}`));
      appendLine(out(`Latest:  ${remoteLabel}`));

      if (vInfo.remoteDate) {
        const d = new Date(vInfo.remoteDate);
        appendLine(out(`Commit date: ${d.toUTCString()}`));
      }

      if (vInfo.updateAvailable) {
        appendLine(out(''));
        appendLine(warn("⚡ Update available! Run 'ampos-update' to install."));
      } else {
        appendLine(out(''));
        appendLine(info('✅ System is up to date.'));
      }
    }
    appendLine(out(''));
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [appendLine]);

  const runAmposUpdate = useCallback(async () => {
    setBusy(true);
    appendLine(out(''));

    try {
      const newSha = await performUpdate((step) => {
        appendLine(info(step));
      });

      appendLine(out(''));
      appendLine(info('✅ Update completed successfully!'));
      appendLine(out(`   Installed: ${getVersionLabel()} [${shortSha(newSha)}]`));
      appendLine(out(''));
      appendLine(warn("Run 'reboot' or 'systemctl restart ampos' to apply changes."));
      appendLine(out(''));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'already_up_to_date') {
        appendLine(info('✅ AmPOS is already up to date.'));
      } else {
        appendLine(err(`ampos-update: ${msg}`));
      }
      appendLine(out(''));
    }

    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [appendLine]);

  // ── Submit handler ───────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (busy) return;

      const raw = currentInput;
      const trimmed = raw.trim();
      const echoLine: TerminalLine = { type: 'input', content: `${PROMPT} ${raw}` };

      if (!trimmed) {
        setLines((prev) => [...prev, echoLine]);
        setCurrentInput('');
        return;
      }

      setHistory((prev) => [trimmed, ...prev.slice(0, 99)]);
      setHistoryIndex(-1);
      setCurrentInput('');

      const [cmd, ...args] = trimmed.split(/\s+/);
      const lower = cmd.toLowerCase();

      // Async commands
      if (lower === 'check-update') {
        setLines((prev) => [...prev, echoLine]);
        runCheckUpdate();
        return;
      }
      if (lower === 'ampos-update') {
        setLines((prev) => [...prev, echoLine]);
        runAmposUpdate();
        return;
      }

      // Sync commands
      const handler = SYNC_COMMANDS[lower];
      const result: TerminalLine[] = handler
        ? handler(args, { logout, setLines })
        : [err(`bash: ${cmd}: command not found`)];

      setLines((prev) => [...prev, echoLine, ...result]);
    },
    [busy, currentInput, logout, runCheckUpdate, runAmposUpdate]
  );

  // ── Key handler ──────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const nextIdx = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(nextIdx);
        setCurrentInput(history[nextIdx] ?? '');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = Math.max(historyIndex - 1, -1);
        setHistoryIndex(nextIdx);
        setCurrentInput(nextIdx === -1 ? '' : history[nextIdx]);
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        setLines([]);
      } else if (e.key === 'c' && e.ctrlKey) {
        e.preventDefault();
        if (busy) {
          // ^C while busy just shows the echo — actual abort would need AbortController
          appendLine({ type: 'input', content: `${PROMPT} ${currentInput}^C` });
          setCurrentInput('');
        }
      }
    },
    [history, historyIndex, busy, currentInput, appendLine]
  );

  // ─── Color map ───────────────────────────────────────────────────────────────
  const lineColor = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'error':  return '#f87171';  // red
      case 'info':   return '#4ade80';  // green
      case 'warn':   return '#facc15';  // yellow
      case 'input':  return '#93c5fd';  // blue
      default:       return '#e5e5e5';  // white
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        height: '100%',
        background: '#0a0a0a',
        color: '#e5e5e5',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '13px',
        lineHeight: '1.6',
        padding: '12px 16px',
        overflowY: 'auto',
        cursor: 'text',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output history */}
      <div style={{ flex: 1 }}>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              color: lineColor(line.type),
            }}
          >
            {line.content || '\u00A0'}
          </div>
        ))}

        {/* "Running…" spinner while async command executes */}
        {busy && (
          <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
            working...
          </div>
        )}
      </div>

      {/* Input prompt row — hidden while busy */}
      {!busy && (
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}
        >
          <span style={{ color: '#4ade80', whiteSpace: 'pre', userSelect: 'none' }}>
            {PROMPT}{' '}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e5e5e5',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              caretColor: '#e5e5e5',
            }}
          />
        </form>
      )}

      <div ref={bottomRef} />

      <style>{`
        ::-webkit-scrollbar { width: 0; }
      `}</style>
    </div>
  );
};

export default Terminal;
