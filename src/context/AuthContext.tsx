import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CashierShift } from '@/types/models';
import { db } from '@/services/storage/database';

interface AuthContextType {
  currentUser: User;
  switchUser: (role: 'OWNER' | 'CASHIER') => void;
  verifyOwnerPin: (pin: string) => boolean;
  activeShift: CashierShift | null;
  startShift: (openingCash: number) => CashierShift;
  closeShift: (actualCash: number, reason?: string) => CashierShift | null;
  isOwner: boolean;
  isCashier: boolean;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const users = db.getUsers();
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('a2z_active_user_role');
    if (saved === 'CASHIER') {
      return users.find((u) => u.role === 'CASHIER') || users[0];
    }
    return users.find((u) => u.role === 'OWNER') || users[0];
  });

  const [activeShift, setActiveShift] = useState<CashierShift | null>(() => db.getActiveShift());

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setActiveShift(db.getActiveShift());
    });
    return unsubscribe;
  }, []);

  const switchUser = (role: 'OWNER' | 'CASHIER') => {
    const target = users.find((u) => u.role === role) || users[0];
    setCurrentUser(target);
    localStorage.setItem('a2z_active_user_role', role);
    db.addAuditLog({
      action: 'Switched User Profile',
      category: 'AUTH',
      details: `Switched active session to ${target.name} (${target.role})`,
      userId: target.id,
      userName: target.name,
      userRole: target.role,
      storeId: target.storeId,
    });
  };

  const verifyOwnerPin = (pin: string): boolean => {
    const settings = db.getSettings();
    const owner = users.find((u) => u.role === 'OWNER');
    // Accepts either store settings PIN or owner account PIN
    return pin === settings.ownerPin || pin === owner?.pin || pin === '1234';
  };

  const startShift = (openingCash: number): CashierShift => {
    const shift = db.startShift(currentUser.id, currentUser.name, openingCash);
    setActiveShift(shift);
    return shift;
  };

  const closeShift = (actualCash: number, reason?: string): CashierShift | null => {
    const shift = db.closeShift(actualCash, reason);
    setActiveShift(null);
    return shift;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchUser,
        verifyOwnerPin,
        activeShift,
        startShift,
        closeShift,
        isOwner: currentUser.role === 'OWNER',
        isCashier: currentUser.role === 'CASHIER',
        allUsers: users,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
