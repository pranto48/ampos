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
import LoginScreen from '@/components/os/LoginScreen';
import Desktop from '@/components/os/Desktop';

/**
 * OSContent drives the top-level phase state machine:
 *
 *   booting  ──onComplete──►  logging_in  ──login()──►  desktop
 *                                  ▲                       │
 *                                  └──────logout()─────────┘
 */
const OSContent: React.FC = () => {
  const { phase, setPhase } = useOS();

  if (phase === 'booting') {
    return <BootScreen onComplete={() => setPhase('logging_in')} />;
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
