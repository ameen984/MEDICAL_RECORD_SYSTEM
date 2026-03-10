
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store.ts';
import LoginPage from '../features/auth/LoginPage.tsx';
import SignupPage from '../features/auth/SignupPage.tsx';
import ForgotPassword from '../features/auth/ForgotPassword.tsx';
import ResetPassword from '../features/auth/ResetPassword.tsx';
import DashboardLayout from '../features/dashboard/DashboardLayout.tsx';
import DashboardPage from '../features/dashboard/DashboardPage.tsx';
import ProtectedRoute from './ProtectedRoute.tsx';
import UnauthorizedPage from '../pages/UnauthorizedPage.tsx';

// Admin components
import UserList from '../features/admin/UserList.tsx';
import HospitalList from '../features/admin/HospitalList.tsx';
import AuditLogs from '../features/admin/AuditLogs.tsx';

// Doctor components
import PatientList from '../features/doctor/PatientList.tsx';
import MedicalHistory from '../features/doctor/MedicalHistory.tsx';

import AddMedicalRecord from '../features/doctor/AddMedicalRecord.tsx';
import UploadReport from '../features/doctor/UploadReport.tsx';

// Patient components
import MyRecords from '../features/patient/MyRecords.tsx';
import MyReports from '../features/patient/MyReports.tsx';
import Profile from '../features/patient/Profile.tsx';

// Account settings for non-patient roles
import AccountSettings from '../features/account/AccountSettings.tsx';

// Single /profile entry point — renders correct page based on role
const ProfilePage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'patient' ? <Profile /> : <AccountSettings />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            
            {/* Super Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
              <Route path="hospitals" element={<HospitalList />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
              <Route path="users" element={<UserList />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>
            
            {/* Doctor Routes */}
            <Route element={<ProtectedRoute allowedRoles={['doctor', 'admin']} />}>
              <Route path="patients" element={<PatientList />} />
              <Route path="patients/:patientId" element={<MedicalHistory />} />
              <Route path="records/add" element={<AddMedicalRecord />} />
              <Route path="reports/upload" element={<UploadReport />} />
            </Route>
            
            {/* Profile — role-aware, accessible to all authenticated users */}
            <Route path="profile" element={<ProfilePage />} />

            {/* Patient Routes */}
            <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
              <Route path="records" element={<MyRecords />} />
              <Route path="reports" element={<MyReports />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
