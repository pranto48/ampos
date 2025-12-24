import React from 'react';
import { useOS } from '@/contexts/OSContext';
import { useTheme } from '@/contexts/ThemeContext';
import DesktopIcons from './DesktopIcons';
import Taskbar from './Taskbar';
import WindowManager from './WindowManager';
import StartMenu from './StartMenu';

const Desktop: React.FC = () => {
  const { closeStartMenu, isStartMenuOpen } = useOS();
  const { theme, wallpaper } = useTheme();

  const renderWallpaper = () => {
    switch (wallpaper) {
      case 'aurora':
        return <div className="wallpaper-aurora" />;
      case 'waves':
        return (
          <div className="wallpaper-waves">
            <div className="wave wave-1" />
            <div className="wave wave-2" />
            <div className="wave wave-3" />
          </div>
        );
      case 'particles':
        return (
          <div className="wallpaper-particles">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 15}s`,
                  animationDuration: `${12 + Math.random() * 8}s`,
                }}
              />
            ))}
          </div>
        );
      case 'gradient':
        return <div className="wallpaper-gradient-flow" />;
      case 'nebula':
        return (
          <div className="wallpaper-nebula">
            <div className="nebula-cloud nebula-1" />
            <div className="nebula-cloud nebula-2" />
            <div className="nebula-cloud nebula-3" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-desktop overflow-hidden select-none">
      {/* Desktop Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-background via-desktop to-background" />
        
        {/* Animated Wallpaper */}
        {renderWallpaper()}
        
        {theme === 'liquid-glass' ? (
          /* iOS 26 Water Glass Theme Background */
          <>
            <div className="water-orb water-orb-1" />
            <div className="water-orb water-orb-2" />
            <div className="water-orb water-orb-3" />
            <div className="water-orb water-orb-4" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-teal-900/10" />
          </>
        ) : (
          /* Default Theme Background */
          <>
            <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl" />
          </>
        )}
      </div>

      {/* Desktop Icons Area */}
      <div 
        className="absolute inset-0 bottom-14 p-4"
        onClick={closeStartMenu}
      >
        <DesktopIcons />
      </div>

      {/* Windows */}
      <WindowManager />

      {/* Start Menu */}
      {isStartMenuOpen && <StartMenu />}

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
};

export default Desktop;
