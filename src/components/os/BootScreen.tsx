/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */
import { useEffect, useRef, useState } from "react";

interface BootLine {
  text: string;
  delay: number; // ms to wait before printing this line
}

const BOOT_SEQUENCE: BootLine[] = [
  { text: "BIOS version 2.5.0  Copyright (C) AmPOS Systems", delay: 0 },
  { text: "", delay: 80 },
  { text: "CPU: Intel(R) Core(TM) i5-1135G7 @ 2.40GHz", delay: 120 },
  { text: "Memory: 8192 MB DDR4", delay: 80 },
  { text: "Storage: 256GB NVMe SSD", delay: 80 },
  { text: "", delay: 200 },
  { text: "Loading GRUB bootloader...", delay: 300 },
  { text: "", delay: 150 },
  { text: "GNU GRUB  version 2.12", delay: 100 },
  { text: "", delay: 500 },
  { text: "Loading Linux kernel 6.6.21-amd64 ...", delay: 200 },
  { text: "Loading initial ramdisk ...", delay: 300 },
  { text: "", delay: 400 },
  { text: "[    0.000000] Linux version 6.6.21-amd64 (Debian 6.6.21-1)", delay: 100 },
  { text: "[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.6.21-amd64 root=/dev/sda1 ro quiet splash", delay: 80 },
  { text: "[    0.000000] BIOS-provided physical RAM map:", delay: 60 },
  { text: "[    0.000000] ACPI: RSDP 0x00000000000F05B0 000024 (v02 BOCHS)", delay: 80 },
  { text: "[    0.001000] ACPI: IRQ0 used by override.", delay: 60 },
  { text: "[    0.002000] PCI: Using configuration type 1 for base access", delay: 80 },
  { text: "[    0.004000] clocksource: tsc-early: mask: 0xffffffffffffffff", delay: 60 },
  { text: "[    0.006000] Booting paravirtualized kernel on bare hardware", delay: 80 },
  { text: "[    0.008000] setup_percpu: NR_CPUS:8192 nr_cpumask_bits:4 nr_cpu_ids:4", delay: 60 },
  { text: "[    0.120000] Initializing cgroup subsys cpuset", delay: 80 },
  { text: "[    0.121000] Initializing cgroup subsys cpu", delay: 60 },
  { text: "[    0.122000] Initializing cgroup subsys cpuacct", delay: 60 },
  { text: "[    0.200000] NET: Registered PF_INET6 protocol family", delay: 80 },
  { text: "[    0.350000] ACPI: bus type USB registered", delay: 100 },
  { text: "[    0.420000] usbcore: registered new interface driver usbhid", delay: 80 },
  { text: "[    0.500000] input: Power Button as /devices/LNXSYSTM:00", delay: 80 },
  { text: "[    0.620000] EXT4-fs (sda1): mounted filesystem", delay: 100 },
  { text: "", delay: 200 },
  { text: "[  OK  ] Started Journal Service.", delay: 180 },
  { text: "[  OK  ] Reached target Local File Systems (Pre).", delay: 150 },
  { text: "[  OK  ] Mounted Huge Pages File System.", delay: 130 },
  { text: "[  OK  ] Mounted POSIX Message Queue File System.", delay: 140 },
  { text: "[  OK  ] Mounted Kernel Debug File System.", delay: 130 },
  { text: "[  OK  ] Started Remount Root and Kernel File Systems.", delay: 160 },
  { text: "[  OK  ] Reached target Local File Systems.", delay: 140 },
  { text: "[  OK  ] Started Apply Kernel Variables.", delay: 130 },
  { text: "[  OK  ] Started Create Static Device Nodes.", delay: 150 },
  { text: "[  OK  ] Started Load Kernel Modules.", delay: 140 },
  { text: "[  OK  ] Started udev Kernel Device Manager.", delay: 180 },
  { text: "[  OK  ] Reached target System Initialization.", delay: 160 },
  { text: "[  OK  ] Started D-Bus System Message Bus.", delay: 170 },
  { text: "[  OK  ] Started Network Manager.", delay: 200 },
  { text: "[  OK  ] Reached target Network.", delay: 150 },
  { text: "[  OK  ] Started OpenSSH Daemon.", delay: 160 },
  { text: "[  OK  ] Started Avahi mDNS/DNS-SD Stack.", delay: 140 },
  { text: "[  OK  ] Started CUPS Scheduler.", delay: 150 },
  { text: "[  OK  ] Reached target Multi-User System.", delay: 180 },
  { text: "[  OK  ] Reached target Graphical Interface.", delay: 170 },
  { text: "", delay: 100 },
  { text: "AmPOS Linux 1.0 (GNU/Linux 6.6.21-amd64 x86_64)", delay: 300 },
  { text: "", delay: 100 },
];

function colorize(line: string): React.ReactNode {
  if (line.startsWith("[  OK  ]")) {
    return (
      <>
        <span className="boot-ok">[  OK  ]</span>
        {line.slice(8)}
      </>
    );
  }
  if (line.startsWith("[   ")) {
    // Kernel dmesg lines
    return <span className="boot-dmesg">{line}</span>;
  }
  if (
    line.startsWith("Loading") ||
    line.startsWith("GNU GRUB") ||
    line.startsWith("BIOS") ||
    line.startsWith("CPU:") ||
    line.startsWith("Memory:") ||
    line.startsWith("Storage:")
  ) {
    return <span className="boot-info">{line}</span>;
  }
  if (line.startsWith("AmPOS Linux")) {
    return <span className="boot-brand">{line}</span>;
  }
  return <>{line}</>;
}

interface BootScreenProps {
  onComplete: () => void;
}

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    let cancelled = false;

    const run = async () => {
      for (const { text, delay } of BOOT_SEQUENCE) {
        if (cancelled) return;
        // Wait for the line's own delay
        await new Promise<void>((res) => setTimeout(res, delay));
        if (cancelled) return;
        setVisibleLines((prev) => [...prev, text]);
        // Tiny jitter after printing so lines don't arrive in perfect sync
        const jitter = Math.random() * 60;
        await new Promise<void>((res) => setTimeout(res, jitter));
      }
      if (cancelled) return;
      setDone(true);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll to bottom as lines appear
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [visibleLines]);

  // Trigger onComplete after the "done" state is set and a short pause
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(onComplete, 600);
    return () => clearTimeout(timer);
  }, [done, onComplete]);

  return (
    <div className="boot-screen">
      <style>{`
        .boot-screen {
          position: fixed;
          inset: 0;
          background: #0a0a0a;
          color: #d0d0d0;
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          line-height: 1.55;
          padding: 16px 20px;
          overflow: hidden;
          z-index: 9999;
        }
        .boot-screen pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .boot-ok {
          color: #22c55e;
          font-weight: bold;
        }
        .boot-dmesg {
          color: #6b7280;
        }
        .boot-info {
          color: #94a3b8;
        }
        .boot-brand {
          color: #38bdf8;
          font-weight: bold;
        }
        .boot-cursor {
          display: inline-block;
          width: 8px;
          height: 1em;
          background: #d0d0d0;
          vertical-align: text-bottom;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>

      <pre>
        {visibleLines.map((line, i) => (
          <div key={i}>
            {line === "" ? "\u00A0" : colorize(line)}
          </div>
        ))}
        {!done && <span className="boot-cursor" />}
      </pre>

      <div ref={bottomRef} />
    </div>
  );
}
