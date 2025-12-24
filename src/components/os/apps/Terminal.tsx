import React, { useState, useRef, useEffect } from 'react';

interface TerminalLine {
  type: 'input' | 'output' | 'error';
  content: string;
}

const Terminal: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: 'AMPOS Terminal v1.0.0' },
    { type: 'output', content: 'Type "help" for available commands.' },
    { type: 'output', content: '' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const commands: Record<string, (args: string[]) => string | string[]> = {
    help: () => [
      'Available commands:',
      '  help     - Show this help message',
      '  clear    - Clear the terminal',
      '  echo     - Echo a message',
      '  date     - Show current date and time',
      '  whoami   - Show current user',
      '  hostname - Show system hostname',
      '  uptime   - Show system uptime',
      '  ls       - List files (simulated)',
      '  pwd      - Print working directory',
      '  neofetch - Show system info',
    ],
    clear: () => {
      setLines([]);
      return '';
    },
    echo: (args) => args.join(' '),
    date: () => new Date().toString(),
    whoami: () => 'admin',
    hostname: () => 'AMPOS-SERVER',
    uptime: () => 'up 2 days, 14 hours, 32 minutes',
    pwd: () => '/home/admin',
    ls: () => [
      'Documents/',
      'Downloads/',
      'Pictures/',
      'Videos/',
      'Music/',
      '.config/',
    ],
    neofetch: () => [
      '',
      '    ╭───────────────────╮',
      '    │      AMPOS        │',
      '    │   Web Operating   │',
      '    │      System       │',
      '    ╰───────────────────╯',
      '',
      '  OS: AMPOS v1.0.0',
      '  Host: Browser Environment',
      '  Kernel: Chromium/Firefox',
      '  Shell: AMPOS Terminal',
      '  Resolution: ' + window.innerWidth + 'x' + window.innerHeight,
      '  Theme: Dark Mode',
      '  Terminal: AMPOS Term',
      '',
    ],
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentInput.trim()) {
      setLines((prev) => [...prev, { type: 'input', content: '$ ' }]);
      return;
    }

    const [cmd, ...args] = currentInput.trim().split(' ');
    const command = commands[cmd.toLowerCase()];

    const newLines: TerminalLine[] = [
      { type: 'input', content: `$ ${currentInput}` },
    ];

    if (command) {
      const result = command(args);
      if (result) {
        if (Array.isArray(result)) {
          result.forEach((line) => {
            newLines.push({ type: 'output', content: line });
          });
        } else {
          newLines.push({ type: 'output', content: result });
        }
      }
    } else {
      newLines.push({
        type: 'error',
        content: `Command not found: ${cmd}. Type "help" for available commands.`,
      });
    }

    setLines((prev) => [...prev, ...newLines]);
    setCurrentInput('');
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="h-full bg-background font-mono text-sm p-4 overflow-auto"
      ref={containerRef}
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((line, index) => (
        <div
          key={index}
          className={`whitespace-pre-wrap ${
            line.type === 'input'
              ? 'text-primary'
              : line.type === 'error'
              ? 'text-destructive'
              : 'text-foreground'
          }`}
        >
          {line.content}
        </div>
      ))}
      
      <form onSubmit={handleSubmit} className="flex items-center">
        <span className="text-primary">$ </span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          className="flex-1 bg-transparent outline-none text-foreground ml-1"
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
};

export default Terminal;
