import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreSettings } from '@/types/models';
import { db } from '@/services/storage/database';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface StoreContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  isOnline: boolean;
  toggleOnline: () => void;
  pendingSyncCount: number;
  darkMode: boolean;
  toggleDarkMode: () => void;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(() => db.getSettings());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('a2z_theme') === 'dark';
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (pendingSyncCount > 0) {
        addToast('success', 'Synchronized', `${pendingSyncCount} offline records synced successfully.`);
        setPendingSyncCount(0);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast('warning', 'Offline Mode', 'Connection lost. POS billing is operating in local offline cache mode.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = db.subscribe(() => {
      setSettings(db.getSettings());
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [pendingSyncCount]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('a2z_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('a2z_theme', 'light');
    }
  }, [darkMode]);

  const toggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (!nextState) {
      setPendingSyncCount((prev) => prev + 1);
      addToast('warning', 'Simulation', 'Simulating Offline Mode. Local billing cache active.');
    } else {
      addToast('success', 'Back Online', 'Reconnected to cloud. Cloud sync operational.');
      setPendingSyncCount(0);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    const currentUser = db.getUsers()[0];
    db.updateSettings(newSettings, currentUser);
    setSettings(db.getSettings());
    addToast('success', 'Settings Saved', 'Store configuration successfully updated.');
  };

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        updateSettings,
        isOnline,
        toggleOnline,
        pendingSyncCount,
        darkMode,
        toggleDarkMode,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
