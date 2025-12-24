import React, { useState, useEffect } from 'react';
import { Cpu, MemoryStick, HardDrive, Wifi, Activity, Thermometer, Clock, Server } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SystemStats {
  cpu: { usage: number; temp: number; cores: number };
  memory: { used: number; total: number; percentage: number };
  disk: { used: number; total: number; percentage: number };
  network: { download: number; upload: number };
}

const SystemMonitor: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    cpu: { usage: 35, temp: 45, cores: 8 },
    memory: { used: 8.5, total: 16, percentage: 53 },
    disk: { used: 256, total: 512, percentage: 50 },
    network: { download: 12.5, upload: 3.2 },
  });

  const [uptime, setUptime] = useState('2d 14h 32m');

  // Simulate changing stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        cpu: {
          ...prev.cpu,
          usage: Math.min(100, Math.max(10, prev.cpu.usage + (Math.random() - 0.5) * 10)),
          temp: Math.min(80, Math.max(35, prev.cpu.temp + (Math.random() - 0.5) * 3)),
        },
        memory: {
          ...prev.memory,
          percentage: Math.min(90, Math.max(30, prev.memory.percentage + (Math.random() - 0.5) * 5)),
        },
        disk: prev.disk,
        network: {
          download: Math.max(0, prev.network.download + (Math.random() - 0.5) * 5),
          upload: Math.max(0, prev.network.upload + (Math.random() - 0.5) * 2),
        },
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const StatCard: React.FC<{
    icon: React.FC<{ className?: string }>;
    title: string;
    value: string;
    percentage?: number;
    color: string;
    extra?: React.ReactNode;
  }> = ({ icon: Icon, title, value, percentage, color, extra }) => (
    <div className="glass p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <span className="text-lg font-bold text-foreground">{value}</span>
      </div>
      {percentage !== undefined && (
        <Progress value={percentage} className="h-2" />
      )}
      {extra}
    </div>
  );

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">System Monitor</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Uptime: {uptime}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Cpu}
          title="CPU Usage"
          value={`${stats.cpu.usage.toFixed(0)}%`}
          percentage={stats.cpu.usage}
          color="bg-primary/20 text-primary"
          extra={
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{stats.cpu.cores} Cores</span>
              <div className="flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                <span>{stats.cpu.temp.toFixed(0)}°C</span>
              </div>
            </div>
          }
        />

        <StatCard
          icon={MemoryStick}
          title="Memory"
          value={`${stats.memory.used.toFixed(1)} GB`}
          percentage={stats.memory.percentage}
          color="bg-success/20 text-success"
          extra={
            <div className="text-xs text-muted-foreground">
              {stats.memory.used.toFixed(1)} / {stats.memory.total} GB
            </div>
          }
        />

        <StatCard
          icon={HardDrive}
          title="Disk Usage"
          value={`${stats.disk.percentage}%`}
          percentage={stats.disk.percentage}
          color="bg-warning/20 text-warning"
          extra={
            <div className="text-xs text-muted-foreground">
              {stats.disk.used} / {stats.disk.total} GB
            </div>
          }
        />

        <StatCard
          icon={Wifi}
          title="Network"
          value={`${stats.network.download.toFixed(1)} MB/s`}
          color="bg-info/20 text-info"
          extra={
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>↓ {stats.network.download.toFixed(1)} MB/s</span>
              <span>↑ {stats.network.upload.toFixed(1)} MB/s</span>
            </div>
          }
        />
      </div>

      {/* System Info */}
      <div className="glass p-4">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          System Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hostname</span>
              <span className="text-foreground font-mono">AMPOS-SERVER</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">OS</span>
              <span className="text-foreground font-mono">AMPOS v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kernel</span>
              <span className="text-foreground font-mono">5.15.0-generic</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">IP Address</span>
              <span className="text-foreground font-mono">192.168.1.100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPU</span>
              <span className="text-foreground font-mono">Intel i7-12700K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GPU</span>
              <span className="text-foreground font-mono">RTX 3080</span>
            </div>
          </div>
        </div>
      </div>

      {/* Processes */}
      <div className="glass p-4">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Top Processes
        </h3>
        <div className="space-y-2">
          {[
            { name: 'node', cpu: 12.5, mem: 256 },
            { name: 'chrome', cpu: 8.2, mem: 512 },
            { name: 'postgres', cpu: 3.1, mem: 128 },
            { name: 'nginx', cpu: 1.5, mem: 64 },
            { name: 'ampos-core', cpu: 0.8, mem: 96 },
          ].map((process, index) => (
            <div key={index} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
              <span className="text-foreground font-mono">{process.name}</span>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>{process.cpu}%</span>
                <span>{process.mem} MB</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
