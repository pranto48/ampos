/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */
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
