import React from 'react';
import { useOS } from '@/contexts/OSContext';
import { 
  HardDrive, 
  Folder, 
  Monitor, 
  Settings, 
  Store, 
  Terminal,
  Info
} from 'lucide-react';

const desktopIcons = [
  { id: 'file-manager', name: 'File Manager', icon: 'Folder', component: 'FileManager' },
  { id: 'system-monitor', name: 'System Monitor', icon: 'Monitor', component: 'SystemMonitor' },
  { id: 'app-store', name: 'App Store', icon: 'Store', component: 'AppStore' },
  { id: 'terminal', name: 'Terminal', icon: 'Terminal', component: 'Terminal' },
  { id: 'settings', name: 'Settings', icon: 'Settings', component: 'Settings' },
  { id: 'about', name: 'About', icon: 'Info', component: 'About' },
];

const iconComponents: Record<string, React.FC<{ className?: string }>> = {
  Folder,
  Monitor,
  Settings,
  Store,
  Terminal,
  HardDrive,
  Info,
};

const DesktopIcons: React.FC = () => {
  const { openWindow } = useOS();

  const handleDoubleClick = (icon: typeof desktopIcons[0]) => {
    openWindow(icon.id, icon.name, icon.icon, icon.component);
  };

  return (
    <div className="flex flex-col flex-wrap content-start gap-2 h-full">
      {desktopIcons.map((icon) => {
        const IconComponent = iconComponents[icon.icon];
        return (
          <div
            key={icon.id}
            className="flex flex-col items-center justify-center w-20 h-20 rounded-lg cursor-pointer transition-all duration-200 hover:bg-secondary/30 active:bg-secondary/50 group"
            onDoubleClick={() => handleDoubleClick(icon)}
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-200 mb-1">
              {IconComponent && <IconComponent className="w-6 h-6 text-primary" />}
            </div>
            <span className="text-xs text-foreground text-center leading-tight px-1 drop-shadow-lg">
              {icon.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default DesktopIcons;
