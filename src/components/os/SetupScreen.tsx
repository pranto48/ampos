/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */

/**
 * SetupScreen.tsx
 *
 * First-boot OS setup wizard rendered as a Linux TTY.
 *
 * Wizard steps (sequential, one prompt at a time):
 *   1. Admin username
 *   2. Admin password  (hidden)
 *   3. Confirm password
 *   4. Hostname
 *   5. Network mode  (dhcp | static)
 *   6. [static only] IP address
 *   7. [static only] Subnet mask
 *   8. [static only] Gateway
 *   9. SSH port   [default 22]
 *  10. FTP port   [default 21]
 *  11. Web port   [default 80]
 *
 * On completion:
 *   - Saves full config via saveSetupConfig()
 *   - Calls markConfigured()
 *   - Waits ~2 s (simulated reboot) then calls onComplete()
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  saveSetupConfig,
  markConfigured,
  DEFAULT_CONFIG,
} from '@/services/setupConfigService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Line {
  id: number;
  text: string;
  color?: 'green' | 'white' | 'yellow' | 'red' | 'dim' | 'cyan';
}

type Step =
  | 'username'
  | 'password'
  | 'confirm_password'
  | 'hostname'
  | 'network_mode'
  | 'ip'
  | 'subnet'
  | 'gateway'
  | 'ssh_port'
  | 'ftp_port'
  | 'web_port'
  | 'done';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _id = 0;
const mk = (text: string, color?: Line['color']): Line => ({ id: ++_id, text, color });
const isValidPort = (v: string) => {
  const n = parseInt(v, 10);
  return !isNaN(n) && n > 0 && n <= 65535;
};
const isValidIp = (v: string) =>
  /^(\d{1,3}\.){3}\d{1,3}$/.test(v) &&
  v.split('.').every((o) => parseInt(o, 10) <= 255);

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
}

// ─── Banner ───────────────────────────────────────────────────────────────────

const BANNER: Line[] = [
  mk(''),
  mk('  ╔══════════════════════════════════════════════════════╗', 'cyan'),
  mk('  ║         AmPOS Linux — First Boot Setup Wizard        ║', 'cyan'),
  mk('  ║          IT Support BD  ·  itsupport.com.bd          ║', 'cyan'),
  mk('  ╚══════════════════════════════════════════════════════╝', 'cyan'),
  mk(''),
  mk('  Welcome! This wizard will configure your AmPOS installation.', 'white'),
  mk('  Press Enter to accept defaults shown in [brackets].', 'dim'),
  mk(''),
  mk('─────────────────────────────────────────────────────────────', 'dim'),
  mk(''),
];

// ─── Prompt map ───────────────────────────────────────────────────────────────

const PROMPTS: Record<Step, string> = {
  username:         '  Enter new Admin Username [admin]: ',
  password:         '  Enter new Admin Password: ',
  confirm_password: '  Confirm Admin Password: ',
  hostname:         '  Enter Hostname [ampos-srv]: ',
  network_mode:     '  Network Setup — DHCP or Static? [dhcp]: ',
  ip:               '  Enter IP Address [192.168.1.100]: ',
  subnet:           '  Enter Subnet Mask [255.255.255.0]: ',
  gateway:          '  Enter Default Gateway [192.168.1.1]: ',
  ssh_port:         '  Enter SSH Port [22]: ',
  ftp_port:         '  Enter FTP Port [21]: ',
  web_port:         '  Enter Web Server Port [80]: ',
  done:             '',
};

// ─── Component ────────────────────────────────────────────────────────────────

const SetupScreen: React.FC<Props> = ({ onComplete }) => {
  const [lines, setLines] = useState<Line[]>(BANNER);
  const [step, setStep] = useState<Step>('username');
  const [input, setInput] = useState('');

  // Collected values
  const [collected, setCollected] = useState({
    username:    '',
    password:    '',
    hostname:    '',
    networkMode: 'dhcp' as 'dhcp' | 'static',
    ipAddress:   '',
    subnetMask:  '',
    gateway:     '',
    sshPort:     22,
    ftpPort:     21,
    webPort:     80,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const append = useCallback((text: string, color?: Line['color']) => {
    setLines((prev) => [...prev, mk(text, color)]);
  }, []);

  const focus = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 30);
  }, []);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // ── Initial focus ────────────────────────────────────────────────────────────

  useEffect(() => { focus(); }, [focus]);

  // ── Refocus on step change ───────────────────────────────────────────────────

  useEffect(() => {
    if (step !== 'done') focus();
  }, [step, focus]);

  // ── Save & complete ──────────────────────────────────────────────────────────

  const finishSetup = useCallback((final: typeof collected) => {
    saveSetupConfig({
      adminUsername:    final.username    || DEFAULT_CONFIG.adminUsername,
      adminPassword:    final.password    || DEFAULT_CONFIG.adminPassword,
      hostname:         final.hostname    || DEFAULT_CONFIG.hostname,
      networkMode:      final.networkMode,
      ipAddress:        final.ipAddress   || DEFAULT_CONFIG.ipAddress,
      subnetMask:       final.subnetMask  || DEFAULT_CONFIG.subnetMask,
      gateway:          final.gateway     || DEFAULT_CONFIG.gateway,
      sshPort:          final.sshPort,
      ftpPort:          final.ftpPort,
      webPort:          final.webPort,
    });
    markConfigured();

    // Simulated reboot sequence
    setTimeout(() => append(''), 200);
    setTimeout(() => append('  ─────────────────────────────────────────────────────', 'dim'), 300);
    setTimeout(() => append('  [ OK ] Configuration saved.', 'green'), 600);
    setTimeout(() => append('  [ OK ] Writing network configuration...', 'green'), 950);
    setTimeout(() => append('  [ OK ] Generating SSH host keys...', 'green'), 1250);
    setTimeout(() => append('  [ OK ] Starting services...', 'green'), 1550);
    setTimeout(() => append(''), 1800);
    setTimeout(() => append('  Rebooting system...', 'yellow'), 1900);
    setTimeout(() => append(''), 2100);
    setTimeout(() => onComplete(), 2600);
  }, [append, onComplete]);

  // ── Key handler ──────────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();

      const raw = input;
      const val = raw.trim();

      // Helper to echo the prompt+value line (passwords are masked)
      const isHidden = step === 'password' || step === 'confirm_password';
      const echo = PROMPTS[step] + (isHidden ? '●'.repeat(Math.min(raw.length, 12)) : raw);

      setInput('');

      switch (step) {

        // ── Username ────────────────────────────────────────────────────────

        case 'username': {
          const name = val || 'admin';
          append(echo);
          setCollected((c) => ({ ...c, username: name }));
          setStep('password');
          break;
        }

        // ── Password ────────────────────────────────────────────────────────

        case 'password': {
          if (!val) {
            append(echo);
            append('  Password cannot be empty. Please try again.', 'red');
            break;
          }
          append(echo);
          setCollected((c) => ({ ...c, password: val }));
          setStep('confirm_password');
          break;
        }

        // ── Confirm password ────────────────────────────────────────────────

        case 'confirm_password': {
          append(echo);
          if (val !== collected.password) {
            append('  Passwords do not match. Please re-enter.', 'red');
            setCollected((c) => ({ ...c, password: '' }));
            setStep('password');
          } else {
            append('  Password confirmed.', 'dim');
            setStep('hostname');
          }
          break;
        }

        // ── Hostname ────────────────────────────────────────────────────────

        case 'hostname': {
          const host = val || 'ampos-srv';
          append(echo);
          setCollected((c) => ({ ...c, hostname: host }));
          append('');
          append('  Network Configuration', 'white');
          append('  ─────────────────────', 'dim');
          setStep('network_mode');
          break;
        }

        // ── Network mode ────────────────────────────────────────────────────

        case 'network_mode': {
          const mode = (val.toLowerCase() === 'static') ? 'static' : 'dhcp';
          append(echo);
          setCollected((c) => ({ ...c, networkMode: mode }));
          if (mode === 'static') {
            setStep('ip');
          } else {
            append('  DHCP selected — IP will be assigned automatically.', 'dim');
            append('');
            append('  Service Ports', 'white');
            append('  ─────────────', 'dim');
            setStep('ssh_port');
          }
          break;
        }

        // ── Static IP ───────────────────────────────────────────────────────

        case 'ip': {
          const ip = val || '192.168.1.100';
          if (!isValidIp(ip)) {
            append(echo);
            append('  Invalid IP address. Please enter a valid IPv4 address.', 'red');
            break;
          }
          append(echo);
          setCollected((c) => ({ ...c, ipAddress: ip }));
          setStep('subnet');
          break;
        }

        case 'subnet': {
          const sub = val || '255.255.255.0';
          if (!isValidIp(sub)) {
            append(echo);
            append('  Invalid subnet mask. Please try again.', 'red');
            break;
          }
          append(echo);
          setCollected((c) => ({ ...c, subnetMask: sub }));
          setStep('gateway');
          break;
        }

        case 'gateway': {
          const gw = val || '192.168.1.1';
          if (!isValidIp(gw)) {
            append(echo);
            append('  Invalid gateway address. Please try again.', 'red');
            break;
          }
          append(echo);
          setCollected((c) => ({ ...c, gateway: gw }));
          append('');
          append('  Service Ports', 'white');
          append('  ─────────────', 'dim');
          setStep('ssh_port');
          break;
        }

        // ── Ports ───────────────────────────────────────────────────────────

        case 'ssh_port': {
          const port = val ? parseInt(val, 10) : 22;
          if (!isValidPort(String(port))) {
            append(echo);
            append('  Invalid port number (1–65535).', 'red');
            break;
          }
          append(echo);
          setCollected((c) => ({ ...c, sshPort: port }));
          setStep('ftp_port');
          break;
        }

        case 'ftp_port': {
          const port = val ? parseInt(val, 10) : 21;
          if (!isValidPort(String(port))) {
            append(echo);
            append('  Invalid port number (1–65535).', 'red');
            break;
          }
          append(echo);
          setCollected((c) => ({ ...c, ftpPort: port }));
          setStep('web_port');
          break;
        }

        case 'web_port': {
          const port = val ? parseInt(val, 10) : 80;
          if (!isValidPort(String(port))) {
            append(echo);
            append('  Invalid port number (1–65535).', 'red');
            break;
          }
          append(echo);
          const final = { ...collected, webPort: port };
          setCollected(final);

          // Summary before saving
          append('');
          append('  ─────────────────────────────────────────────────────', 'dim');
          append('  Configuration Summary', 'white');
          append('  ─────────────────────────────────────────────────────', 'dim');
          append(`    Username   : ${final.username || 'admin'}`);
          append(`    Hostname   : ${final.hostname || 'ampos-srv'}`);
          append(`    Network    : ${final.networkMode.toUpperCase()}${
            final.networkMode === 'static'
              ? `  (${final.ipAddress}/${final.subnetMask} via ${final.gateway})`
              : ''
          }`);
          append(`    SSH Port   : ${final.sshPort}`);
          append(`    FTP Port   : ${final.ftpPort}`);
          append(`    Web Port   : ${final.webPort}`);
          append('  ─────────────────────────────────────────────────────', 'dim');

          setStep('done');
          finishSetup(final);
          break;
        }

        default:
          break;
      }
    },
    [input, step, collected, append, finishSetup]
  );

  // ── Color map ────────────────────────────────────────────────────────────────

  const COLOR: Record<NonNullable<Line['color']>, string> = {
    green:  '#4ade80',
    white:  '#e5e5e5',
    yellow: '#facc15',
    red:    '#f87171',
    dim:    '#6b7280',
    cyan:   '#67e8f9',
  };

  const isHiddenStep = step === 'password' || step === 'confirm_password';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        color: '#e5e5e5',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '14px',
        lineHeight: '1.7',
        padding: '20px 24px',
        overflowY: 'auto',
        cursor: 'text',
        userSelect: 'none',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Past output */}
      {lines.map((line) => (
        <div
          key={line.id}
          style={{
            whiteSpace: 'pre-wrap',
            color: line.color ? COLOR[line.color] : '#e5e5e5',
          }}
        >
          {line.text || '\u00A0'}
        </div>
      ))}

      {/* Active input row */}
      {step !== 'done' && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Prompt label */}
          <span style={{ whiteSpace: 'pre', color: '#4ade80' }}>
            {PROMPTS[step]}
          </span>

          {/* Invisible real input */}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label={PROMPTS[step]}
            style={{
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none',
              width: '1px',
              height: '1px',
            }}
          />

          {/* Visible echo (masked for password steps) */}
          <span style={{ whiteSpace: 'pre', color: '#e5e5e5' }}>
            {isHiddenStep ? '●'.repeat(Math.min(input.length, 24)) : input}
          </span>

          {/* Blinking cursor */}
          <span
            style={{
              display: 'inline-block',
              width: '9px',
              height: '1.1em',
              background: '#4ade80',
              verticalAlign: 'text-bottom',
              animation: 'setup-blink 1.1s step-end infinite',
              marginLeft: '1px',
            }}
          />
        </div>
      )}

      <div ref={bottomRef} />

      <style>{`
        @keyframes setup-blink { 50% { opacity: 0; } }
        ::-webkit-scrollbar { width: 0; }
      `}</style>
    </div>
  );
};

export default SetupScreen;
