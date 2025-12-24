import React from 'react';
import { OSProvider, useOS } from '@/contexts/OSContext';
import LoginScreen from '@/components/os/LoginScreen';
import Desktop from '@/components/os/Desktop';

const OSContent: React.FC = () => {
  const { isLocked } = useOS();

  if (isLocked) {
    return <LoginScreen />;
  }

  return <Desktop />;
};

const Index: React.FC = () => {
  return (
    <OSProvider>
      <OSContent />
    </OSProvider>
  );
};

export default Index;
