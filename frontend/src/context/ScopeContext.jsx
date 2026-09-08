import React, { createContext, useContext, useState } from 'react';
import { SUBSIDIARIES } from '../utils/constants';

const ScopeContext = createContext(null);

export const ScopeProvider = ({ children }) => {
  const [selectedScope, setSelectedScope] = useState('All India');

  return (
    <ScopeContext.Provider value={{ selectedScope, setSelectedScope, subsidiaries: SUBSIDIARIES }}>
      {children}
    </ScopeContext.Provider>
  );
};

export const useScope = () => {
  const context = useContext(ScopeContext);
  if (!context) {
    throw new Error('useScope must be used within a ScopeProvider');
  }
  return context;
};
