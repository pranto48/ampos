export interface Window {
  id: string;
  title: string;
  icon: string;
  component: string;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

export interface DesktopIcon {
  id: string;
  name: string;
  icon: string;
  action: string;
  position: { x: number; y: number };
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'drive';
  size?: string;
  modified?: string;
  path: string;
  icon?: string;
}

export interface SystemInfo {
  hostname: string;
  os: string;
  kernel: string;
  uptime: string;
  cpu: {
    model: string;
    cores: number;
    usage: number;
  };
  memory: {
    total: string;
    used: string;
    free: string;
    percentage: number;
  };
  disk: {
    total: string;
    used: string;
    free: string;
    percentage: number;
  };
  network: {
    ip: string;
    download: string;
    upload: string;
  };
}

export interface AppInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  version: string;
  installed: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
}
