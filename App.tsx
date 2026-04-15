import React from 'react';
import { AppStoreProvider, useAppStore } from './src/store/appStore';
import { HomePage } from './src/pages/HomePage';
import { SearchPage } from './src/pages/SearchPage';
import { LoginPage } from './src/pages/LoginPage';
import { AdminPage } from './src/pages/AdminPage';
import { CheckingAccessPage } from './src/pages/CheckingAccessPage';
import { SessionPage } from './src/pages/SessionPage';

function AppRouter() {
  const { route, adminAccessState } = useAppStore();

  if (route === 'login') {
    return <LoginPage />;
  }

  if (route === 'search') {
    return <SearchPage />;
  }

  if (route === 'admin') {
    if (adminAccessState === 'checking') {
      return <CheckingAccessPage />;
    }

    return <AdminPage />;
  }

  if (route === 'session') {
    return <SessionPage />;
  }

  return <HomePage />;
}

export default function App() {
  return (
    <AppStoreProvider>
      <AppRouter />
    </AppStoreProvider>
  );
}
