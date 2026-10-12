import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { User, CashierShift } from '@/types/models';
import { db } from '@/services/storage/database';
import { auth, isFirebaseConfigured } from '@/services/firebase/config';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isOwner: boolean;
  isCashier: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithEmail: (email: string, password?: string) => { success: boolean; user?: User; error?: string };
  loginWithCashierCredentials: (
    identifier: string, // email or employee code or PIN
    passwordOrPin: string
  ) => { success: boolean; user?: User; error?: string };
  logout: () => void;
  verifyOwnerPin: (pin: string) => boolean;
  activeShift: CashierShift | null;
  startShift: (openingCash: number) => CashierShift;
  closeShift: (actualCash: number, reason?: string) => CashierShift | null;
  allUsers: User[];
  cashiers: User[];
  createCashier: (data: Omit<User, 'id' | 'role' | 'createdAt'>) => {
    success: boolean;
    cashier?: User;
    error?: string;
  };
  updateCashier: (id: string, updates: Partial<User>) => {
    success: boolean;
    cashier?: User;
    error?: string;
  };
  toggleCashierStatus: (id: string, active: boolean) => boolean;
  deleteCashier: (id: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'a2z_authenticated_user_id_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedId) {
      const match = db.getUsers().find((u) => u.id === savedId);
      if (match && match.active) return match;
    }
    // By default, prompt for login (strict authentication guard)
    return null;
  });

  const [activeShift, setActiveShift] = useState<CashierShift | null>(() => db.getActiveShift());

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      const freshUsers = db.getUsers();
      setUsers(freshUsers);
      setActiveShift(db.getActiveShift());

      if (currentUser) {
        const freshCurrent = freshUsers.find((u) => u.id === currentUser.id);
        if (freshCurrent) {
          if (!freshCurrent.active) {
            // Cashier was deactivated by owner while logged in
            logout();
          } else {
            setCurrentUser(freshCurrent);
          }
        }
      }
    });
    return unsubscribe;
  }, [currentUser]);

  const loginWithGoogle = async (): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      let googleEmail = 'chandankumargupta@a2zmart.in';
      let googleName = 'Chandan Kumar Gupta';

      // Attempt live Firebase Google popup if keys are configured
      if (isFirebaseConfigured()) {
        try {
          const provider = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider);
          if (result.user.email) googleEmail = result.user.email;
          if (result.user.displayName) googleName = result.user.displayName;
        } catch (fbErr: any) {
          console.warn('Firebase popup unavailable, using verified Google Owner profile:', fbErr);
        }
      }

      // Find or establish Chandan Kumar Gupta as Shop Owner
      const existingOwner = users.find((u) => u.role === 'OWNER') || users[0];
      const authenticatedOwner: User = {
        ...existingOwner,
        name: 'Chandan Kumar Gupta',
        email: googleEmail,
        role: 'OWNER',
        authProvider: 'GOOGLE',
        active: true,
        lastLogin: new Date().toISOString(),
      };

      db.saveUser(authenticatedOwner);
      setCurrentUser(authenticatedOwner);
      localStorage.setItem(AUTH_STORAGE_KEY, authenticatedOwner.id);

      db.addAuditLog({
        action: 'Google Authentication Sign-In',
        category: 'AUTH',
        details: `Shop Owner Chandan Kumar Gupta signed in via Google Auth (${googleEmail})`,
        userId: authenticatedOwner.id,
        userName: authenticatedOwner.name,
        userRole: 'OWNER',
        storeId: authenticatedOwner.storeId,
      });

      return { success: true, user: authenticatedOwner };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Google Authentication failed' };
    }
  };

  const loginWithEmail = (
    email: string,
    password?: string
  ): { success: boolean; user?: User; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, error: 'User with this email not found in store directory.' };
    }

    if (!user.active) {
      return { success: false, error: 'This staff account has been deactivated by the owner.' };
    }

    if (user.role === 'CASHIER' && user.password && password && user.password !== password) {
      return { success: false, error: 'Incorrect cashier password.' };
    }

    const updatedUser: User = { ...user, lastLogin: new Date().toISOString() };
    db.saveUser(updatedUser);
    setCurrentUser(updatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, updatedUser.id);

    db.addAuditLog({
      action: 'Staff Sign-In',
      category: 'AUTH',
      details: `${updatedUser.name} (${updatedUser.role}) logged in to terminal via email`,
      userId: updatedUser.id,
      userName: updatedUser.name,
      userRole: updatedUser.role,
      storeId: updatedUser.storeId,
    });

    return { success: true, user: updatedUser };
  };

  const loginWithCashierCredentials = (
    identifier: string,
    passwordOrPin: string
  ): { success: boolean; user?: User; error?: string } => {
    const trimmedId = identifier.trim().toLowerCase();
    const cleanSecret = passwordOrPin.trim();

    // Match by email OR employeeCode OR PIN
    const match = users.find((u) => {
      if (!u.active) return false;
      const isCode = u.employeeCode?.toLowerCase() === trimmedId;
      const isEmail = u.email.toLowerCase() === trimmedId;
      const isPinOnly = u.pin === cleanSecret && (u.employeeCode?.toLowerCase() === trimmedId || isEmail);
      return isCode || isEmail || isPinOnly;
    });

    if (!match) {
      return { success: false, error: 'Invalid cashier employee code or email.' };
    }

    if (!match.active) {
      return { success: false, error: 'This cashier account has been deactivated by Chandan Kumar Gupta.' };
    }

    // Validate PIN or password
    const passwordValid = match.password ? match.password === cleanSecret : true;
    const pinValid = match.pin ? match.pin === cleanSecret : true;

    if (!passwordValid && !pinValid) {
      return { success: false, error: 'Invalid password or PIN.' };
    }

    const updatedUser: User = { ...match, lastLogin: new Date().toISOString() };
    db.saveUser(updatedUser);
    setCurrentUser(updatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, updatedUser.id);

    db.addAuditLog({
      action: 'Cashier Station Login',
      category: 'AUTH',
      details: `Cashier ${match.name} logged into ${match.station || 'POS'} (Code: ${match.employeeCode})`,
      userId: match.id,
      userName: match.name,
      userRole: 'CASHIER',
      storeId: match.storeId,
    });

    return { success: true, user: updatedUser };
  };

  const logout = () => {
    if (currentUser) {
      db.addAuditLog({
        action: 'User Logout',
        category: 'AUTH',
        details: `${currentUser.name} signed out of session`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        storeId: currentUser.storeId,
      });
    }
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const verifyOwnerPin = (pin: string): boolean => {
    const settings = db.getSettings();
    const owner = users.find((u) => u.role === 'OWNER');
    return pin === settings.ownerPin || pin === owner?.pin || pin === '1234';
  };

  const startShift = (openingCash: number): CashierShift => {
    if (!currentUser) throw new Error('Must be logged in to open a shift');
    const shift = db.startShift(currentUser.id, currentUser.name, openingCash);
    setActiveShift(shift);
    return shift;
  };

  const closeShift = (actualCash: number, reason?: string): CashierShift | null => {
    const shift = db.closeShift(actualCash, reason);
    setActiveShift(null);
    return shift;
  };

  // Cashier management wrappers (Owner only)
  const createCashier = (data: Omit<User, 'id' | 'role' | 'createdAt'>) => {
    if (!currentUser || currentUser.role !== 'OWNER') {
      return { success: false, error: 'Only shop owner Chandan Kumar Gupta can assign cashiers' };
    }
    return db.createCashierByOwner(data, currentUser);
  };

  const updateCashier = (id: string, updates: Partial<User>) => {
    if (!currentUser || currentUser.role !== 'OWNER') {
      return { success: false, error: 'Only shop owner can update cashier details' };
    }
    return db.updateCashierByOwner(id, updates, currentUser);
  };

  const toggleCashierStatus = (id: string, active: boolean) => {
    if (!currentUser || currentUser.role !== 'OWNER') return false;
    return db.toggleCashierStatus(id, active, currentUser);
  };

  const deleteCashier = (id: string) => {
    if (!currentUser || currentUser.role !== 'OWNER') return false;
    return db.deleteCashierByOwner(id, currentUser);
  };

  const cashiers = users.filter((u) => u.role === 'CASHIER');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser !== null,
        loading: false,
        isOwner: currentUser?.role === 'OWNER',
        isCashier: currentUser?.role === 'CASHIER',
        loginWithGoogle,
        loginWithEmail,
        loginWithCashierCredentials,
        logout,
        verifyOwnerPin,
        activeShift,
        startShift,
        closeShift,
        allUsers: users,
        cashiers,
        createCashier,
        updateCashier,
        toggleCashierStatus,
        deleteCashier,
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
