import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { StoreProvider } from '@/context/StoreContext';
import { CartProvider } from '@/context/CartContext';
import { AppShell } from '@/components/layout/AppShell';

import { OwnerDashboard } from '@/components/dashboard/OwnerDashboard';
import { PosScreen } from '@/components/pos/PosScreen';
import { ProductListScreen } from '@/components/products/ProductListScreen';
import { InventoryScreen } from '@/components/inventory/InventoryScreen';
import { PurchasesScreen } from '@/components/purchases/PurchasesScreen';
import { SalesHistoryScreen } from '@/components/sales/SalesHistoryScreen';
import { CustomersScreen } from '@/components/customers/CustomersScreen';
import { SuppliersScreen } from '@/components/suppliers/SuppliersScreen';
import { ExpensesScreen } from '@/components/expenses/ExpensesScreen';
import { ReportsScreen } from '@/components/reports/ReportsScreen';
import { LabelGeneratorScreen } from '@/components/labels/LabelGeneratorScreen';
import { AuditLogScreen } from '@/components/audit/AuditLogScreen';
import { SettingsScreen } from '@/components/settings/SettingsScreen';

// Protected Route Guard for Owner-only screens
const OwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOwner } = useAuth();
  if (!isOwner) {
    return <Navigate to="/pos" replace />;
  }
  return <>{children}</>;
};

// Root redirect based on role
const RootRedirect: React.FC = () => {
  const { isOwner } = useAuth();
  return isOwner ? <OwnerDashboard /> : <Navigate to="/pos" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppShell />}>
                <Route index element={<RootRedirect />} />
                <Route path="pos" element={<PosScreen />} />
                <Route path="products" element={<ProductListScreen />} />
                <Route path="inventory" element={<InventoryScreen />} />
                <Route
                  path="purchases"
                  element={
                    <OwnerRoute>
                      <PurchasesScreen />
                    </OwnerRoute>
                  }
                />
                <Route path="sales" element={<SalesHistoryScreen />} />
                <Route path="customers" element={<CustomersScreen />} />
                <Route
                  path="suppliers"
                  element={
                    <OwnerRoute>
                      <SuppliersScreen />
                    </OwnerRoute>
                  }
                />
                <Route
                  path="expenses"
                  element={
                    <OwnerRoute>
                      <ExpensesScreen />
                    </OwnerRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <OwnerRoute>
                      <ReportsScreen />
                    </OwnerRoute>
                  }
                />
                <Route
                  path="labels"
                  element={
                    <OwnerRoute>
                      <LabelGeneratorScreen />
                    </OwnerRoute>
                  }
                />
                <Route
                  path="audit"
                  element={
                    <OwnerRoute>
                      <AuditLogScreen />
                    </OwnerRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <OwnerRoute>
                      <SettingsScreen />
                    </OwnerRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
};

export default App;
