import React from 'react';
import { useOS } from '@/contexts/OSContext';
import Window from './Window';
import FileManager from './apps/FileManager';
import SystemMonitor from './apps/SystemMonitor';
import AppStore from './apps/AppStore';
import Terminal from './apps/Terminal';
import Settings from './apps/Settings';
import About from './apps/About';

const appComponents: Record<string, React.FC> = {
  FileManager,
  SystemMonitor,
  AppStore,
  Terminal,
  Settings,
  About,
};

const WindowManager: React.FC = () => {
  const { windows } = useOS();

  return (
    <>
      {windows.map((window) => {
        const AppComponent = appComponents[window.component];
        if (!AppComponent || window.isMinimized) return null;

        return (
          <Window key={window.id} window={window}>
            <AppComponent />
          </Window>
        );
      })}
    </>
  );
};

export default WindowManager;
