import React, { useState, useEffect } from 'react';
import { useOS } from '@/contexts/OSContext';
import { 
  LayoutGrid, 
  Wifi, 
  Volume2, 
  Battery, 
  ChevronUp,
  Power,
  User,
  Folder,
  Monitor,
  Settings,
  Store,
  Terminal,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

const iconComponents: Record<string, React.FC<{ className?: string }>> = {
  Folder,
  Monitor,
  Settings,
  Store,
  Terminal,
  Info,
};

const Taskbar: React.FC = () => {
  const { windows, focusWindow, toggleStartMenu, isStartMenuOpen, user, logout } = useOS();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSystemTray, setShowSystemTray] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-14 taskbar-glass z-50">
      <div className="flex items-center justify-between h-full px-2">
        {/* Start Button */}
        <button
          onClick={toggleStartMenu}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
            isStartMenuOpen ? 'bg-primary/20' : 'hover:bg-secondary/50'
          }`}
        >
          <LayoutGrid className="w-5 h-5 text-primary" />
        </button>

        {/* Running Apps */}
        <div className="flex-1 flex items-center gap-1 px-2 overflow-x-auto">
          {windows.map((window) => {
            const IconComponent = iconComponents[window.icon];
            return (
              <button
                key={window.id}
                onClick={() => focusWindow(window.id)}
                className={`flex items-center gap-2 px-3 h-10 rounded-lg transition-all duration-200 min-w-0 ${
                  window.isFocused && !window.isMinimized
                    ? 'bg-primary/20 border-b-2 border-primary'
                    : 'hover:bg-secondary/50'
                } ${window.isMinimized ? 'opacity-60' : ''}`}
              >
                {IconComponent && <IconComponent className="w-4 h-4 text-primary shrink-0" />}
                <span className="text-sm text-foreground truncate max-w-32">{window.title}</span>
              </button>
            );
          })}
        </div>

        {/* System Tray */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSystemTray(!showSystemTray)}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <ChevronUp className={`w-4 h-4 text-muted-foreground transition-transform ${showSystemTray ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex items-center gap-2 px-2">
            <Wifi className="w-4 h-4 text-muted-foreground" />
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Battery className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Date/Time */}
          <div className="flex flex-col items-end px-3 py-1 hover:bg-secondary/50 rounded-lg cursor-pointer">
            <span className="text-xs text-foreground font-medium">
              {format(currentTime, 'h:mm a')}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(currentTime, 'MMM d, yyyy')}
            </span>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSystemTray(!showSystemTray)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            </button>

            {showSystemTray && (
              <div className="absolute bottom-full right-0 mb-2 w-64 glass-strong p-2 animate-slide-up">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors"
                >
                  <Power className="w-4 h-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
