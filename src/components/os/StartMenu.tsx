import React, { useState } from 'react';
import { useOS } from '@/contexts/OSContext';
import { 
  Search, 
  Folder, 
  Monitor, 
  Settings, 
  Store, 
  Terminal,
  Info,
  Power,
  RefreshCw,
  Moon
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const pinnedApps = [
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
  Info,
};

const StartMenu: React.FC = () => {
  const { openWindow, closeStartMenu, logout, user } = useOS();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApps = pinnedApps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAppClick = (app: typeof pinnedApps[0]) => {
    openWindow(app.id, app.name, app.icon, app.component);
    closeStartMenu();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={closeStartMenu}
      />

      {/* Start Menu */}
      <div className="fixed bottom-16 left-2 w-[500px] glass-strong z-50 animate-slide-up">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border"
            />
          </div>
        </div>

        {/* Pinned Apps */}
        <div className="p-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-3">Pinned</h3>
          <div className="grid grid-cols-4 gap-2">
            {filteredApps.map((app) => {
              const IconComponent = iconComponents[app.icon];
              return (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                    {IconComponent && <IconComponent className="w-5 h-5 text-primary" />}
                  </div>
                  <span className="text-xs text-foreground text-center">{app.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-secondary/50 rounded-lg transition-colors">
              <Moon className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-secondary/50 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button 
              onClick={logout}
              className="p-2 hover:bg-destructive/20 rounded-lg transition-colors"
            >
              <Power className="w-4 h-4 text-destructive" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StartMenu;
