/*
 * Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
 * This file is part of AMPOS.
 *
 * This program is not free software: you can not redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License...
 * (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
 */
import React from 'react';
import { OSProvider, useOS } from '@/contexts/OSContext';
import BootScreen from '@/components/os/BootScreen';
import SetupScreen from '@/components/os/SetupScreen';
import LoginScreen from '@/components/os/LoginScreen';
import Desktop from '@/components/os/Desktop';
import { isConfigured } from '@/services/setupConfigService';

/**
 * OSContent drives the top-level phase state machine.
 *
 * First boot  (ampos_configured absent):
 *   booting ──onComplete──► setup ──onComplete──► logging_in ──login()──► desktop
 *                                                      ▲                      │
 *                                                      └──────logout()────────┘
 *
 * Subsequent boots (ampos_configured = 'true'):
 *   booting ──onComplete──► logging_in ──login()──► desktop
 */
const OSContent: React.FC = () => {
  const { phase, setPhase } = useOS();

  if (phase === 'booting') {
    // After the boot animation, go to setup on first boot, login otherwise.
    const next = isConfigured() ? 'logging_in' : 'setup';
    return <BootScreen onComplete={() => setPhase(next)} />;
  }

  if (phase === 'setup') {
    return <SetupScreen onComplete={() => setPhase('logging_in')} />;
  }

  if (phase === 'logging_in') {
    return <LoginScreen />;
  }

  // phase === 'desktop'
  return <Desktop />;
};

const Index: React.FC = () => (
  <OSProvider>
    <OSContent />
  </OSProvider>
);

export default Index;
