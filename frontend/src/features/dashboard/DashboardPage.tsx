
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store.ts';
import AdminDashboard from '../admin/AdminDashboard.tsx';
import DoctorDashboard from '../doctor/DoctorDashboard.tsx';
import PatientDashboard from '../patient/PatientDashboard.tsx';

const DashboardPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  switch (user.role) {
    case 'super_admin':
    case 'admin':
      return <AdminDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'patient':
      return <PatientDashboard />;
    default:
      return <div>Invalid role</div>;
  }
};

export default DashboardPage;
