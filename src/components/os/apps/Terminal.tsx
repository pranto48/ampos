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

interface TerminalLine {
  type: 'output' | 'input' | 'error' | 'info';
  content: string;
}

const HOSTNAME = 'ampos-srv';
const USERNAME = 'admin';
const PROMPT = `${USERNAME}@${HOSTNAME}:~$`;

// ── Commands ──────────────────────────────────────────────────────────────────

const buildCommands = (
  logout: () => void,
  setLines: React.Dispatch<React.SetStateAction<TerminalLine[]>>
) => {
  const out = (content: string): TerminalLine => ({ type: 'output', content });
  const err = (content: string): TerminalLine => ({ type: 'error', content });
  const info = (content: string): TerminalLine => ({ type: 'info', content });

  type CmdFn = (args: string[]) => TerminalLine[];

  const commands: Record<string, CmdFn> = {
    help: () => [
      out(''),
      info('Available commands:'),
      out('  help        Show this help message'),
      out('  clear       Clear the terminal'),
      out('  echo        Echo text to stdout'),
      out('  date        Print current date/time'),
      out('  whoami      Print current user'),
      out('  hostname    Print system hostname'),
      out('  uptime      Show system uptime'),
      out('  uname       Print kernel/OS info'),
      out('  ls          List directory contents'),
      out('  pwd         Print working directory'),
      out('  env         List environment variables'),
      out('  ps          Show running processes'),
      out('  df          Report disk usage'),
      out('  free        Display memory usage'),
      out('  neofetch    System info summary'),
      out('  logout      Log out of the session'),
      out('  exit        Alias for logout'),
      out(''),
    ],

    clear: () => {
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
      if (full) {
        return [out('Linux ampos-srv 6.6.21-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.6.21-1 (2024-04-12) x86_64 GNU/Linux')];
      }
      return [out('Linux')];
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
      out('        ██████████████         admin@ampos-srv'),
      out('       ███          ███        ─────────────────────────'),
      out('      ███  ████████  ███       OS:     AmPOS Linux 1.0'),
      out('      ███  ████████  ███       Kernel: 6.6.21-amd64'),
      out('      ███  ████████  ███       Shell:  AmPOS Terminal'),
      out('       ███          ███        CPU:    Intel Core i5-1135G7'),
      out('        ██████████████         Memory: 1285MiB / 7965MiB'),
      out('                               Disk:   18G / 236G (8%)'),
      out(`                               Resolution: ${window.innerWidth}x${window.innerHeight}`),
      out(''),
    ],

    logout: () => {
      setTimeout(logout, 300);
      return [out('logout')];
    },

    exit: () => {
      setTimeout(logout, 300);
      return [out('logout')];
    },
  };

  return commands;
};

// ── Component ─────────────────────────────────────────────────────────────────

const MOTD: TerminalLine[] = [
  { type: 'info',   content: 'AmPOS Linux Server - Web Edition  (GNU/Linux 6.6.21-amd64 x86_64)' },
  { type: 'output', content: '' },
  { type: 'output', content: ' * Documentation:  https://portal.itsupport.com.bd' },
  { type: 'output', content: '' },
  { type: 'output', content: `Last login: ${new Date().toDateString()} from 192.168.1.1` },
  { type: 'output', content: '' },
];

const Terminal: React.FC = () => {
  const { logout } = useOS();
  const [lines, setLines] = useState<TerminalLine[]>(MOTD);
  const [currentInput, setCurrentInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const commands = buildCommands(logout, setLines);

  // Auto-scroll on new output
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Auto-focus when mounted
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const raw = currentInput;
      const trimmed = raw.trim();

      // Echo the input line (with prompt)
      const echoLine: TerminalLine = { type: 'input', content: `${PROMPT} ${raw}` };

      if (!trimmed) {
        setLines((prev) => [...prev, echoLine]);
        setCurrentInput('');
        return;
      }

      // History
      setHistory((prev) => [trimmed, ...prev.slice(0, 99)]);
      setHistoryIndex(-1);

      const [cmd, ...args] = trimmed.split(/\s+/);
      const handler = commands[cmd.toLowerCase()];

      const result: TerminalLine[] = handler
        ? handler(args)
        : [{ type: 'error', content: `bash: ${cmd}: command not found` }];

      setLines((prev) => [...prev, echoLine, ...result]);
      setCurrentInput('');
    },
    [currentInput, commands]
  );

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
      }
    },
    [history, historyIndex]
  );

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
              color:
                line.type === 'error'
                  ? '#f87171'
                  : line.type === 'info'
                  ? '#4ade80'
                  : line.type === 'input'
                  ? '#93c5fd'
                  : '#e5e5e5',
            }}
          >
            {line.content || '\u00A0'}
          </div>
        ))}
      </div>

      {/* Input prompt row */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
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

      <div ref={bottomRef} />

      <style>{`
        ::-webkit-scrollbar { width: 0; }
      `}</style>
    </div>
  );
};

export default Terminal;
