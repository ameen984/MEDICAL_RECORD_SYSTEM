
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage.tsx';
import DashboardLayout from '../features/dashboard/DashboardLayout.tsx';
import DashboardPage from '../features/dashboard/DashboardPage.tsx';
import ProtectedRoute from './ProtectedRoute.tsx';
import UnauthorizedPage from '../pages/UnauthorizedPage.tsx';

// Admin components
import UserList from '../features/admin/UserList.tsx';

// Doctor components
import PatientList from '../features/doctor/PatientList.tsx';
import MedicalHistory from '../features/doctor/MedicalHistory.tsx';

import AddMedicalRecord from '../features/doctor/AddMedicalRecord.tsx';
import UploadReport from '../features/doctor/UploadReport.tsx';

// Patient components
import MyRecords from '../features/patient/MyRecords.tsx';
import MyReports from '../features/patient/MyReports.tsx';
import Profile from '../features/patient/Profile.tsx';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="users" element={<UserList />} />
            </Route>
            
            {/* Doctor Routes */}
            <Route element={<ProtectedRoute allowedRoles={['doctor', 'admin']} />}>
              <Route path="patients" element={<PatientList />} />
              <Route path="patients/:patientId" element={<MedicalHistory />} />
              <Route path="records/add" element={<AddMedicalRecord />} />
              <Route path="reports/upload" element={<UploadReport />} />
            </Route>
            
            {/* Patient Routes */}
            <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
              <Route path="records" element={<MyRecords />} />
              <Route path="reports" element={<MyReports />} />
              <Route path="profile" element={<Profile />} />
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
