import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import type { RootState } from '../../app/store';
import DoctorAppointments from './DoctorAppointments';
import PatientAppointments from './PatientAppointments';

const AppointmentsPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  switch (user.role) {
    case 'doctor':
      return <DoctorAppointments />;
    case 'patient':
      return <PatientAppointments />;
    case 'admin':
        // Admin might see all? reuse Doctor view or a specific Admin view.
        // For now, let's allow Admin to see Doctor view (Schedule).
      return <DoctorAppointments />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default AppointmentsPage;
