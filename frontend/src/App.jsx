import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ScopeProvider } from './context/ScopeContext';
import { ToastProvider } from './context/ToastContext';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScopeProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </ScopeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
