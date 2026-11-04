import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';

// Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';

import { DashboardPage } from '../pages/DashboardPage';
import { StartScanPage } from '../pages/StartScanPage';
import { ScanProgressPage } from '../pages/ScanProgressPage';
import { ScanResultsPage } from '../pages/ScanResultsPage';
import { ScanHistoryPage } from '../pages/ScanHistoryPage';
import { CompareScansPage } from '../pages/CompareScansPage';
import { WebsitesPage } from '../pages/WebsitesPage';
import { WebsiteVerificationPage } from '../pages/WebsiteVerificationPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { NotificationsPage } from '../pages/NotificationsPage';

import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected Authenticated Workspace Pages */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/scan/new" element={<StartScanPage />} />
        <Route path="/scans/:id/progress" element={<ScanProgressPage />} />
        <Route path="/scans/:id" element={<ScanResultsPage />} />
        <Route path="/scans" element={<ScanHistoryPage />} />
        <Route path="/scans/compare" element={<CompareScansPage />} />
        <Route path="/websites" element={<WebsitesPage />} />
        <Route path="/websites/:id/verify" element={<WebsiteVerificationPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Administrator Protected Controls */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
