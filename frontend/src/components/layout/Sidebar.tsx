
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  LayoutDashboard, 
  UserPlus,
  Upload,
  FolderOpen
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store.ts';
import clsx from 'clsx';

const Sidebar = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  const adminLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/users', icon: Users },

  ];

  const doctorLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },

    { name: 'Patients', path: '/patients', icon: Users },
    { name: 'Add Record', path: '/records/add', icon: UserPlus },
    { name: 'Upload Report', path: '/reports/upload', icon: Upload },
  ];

  const patientLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },

    { name: 'My Records', path: '/records', icon: FileText },
    { name: 'My Reports', path: '/reports', icon: FolderOpen },
  ];

  const getLinksByRole = () => {
    switch (user.role) {
      case 'admin':
        return adminLinks;
      case 'doctor':
        return doctorLinks;
      case 'patient':
        return patientLinks;
      default:
        return [];
    }
  };

  const links = getLinksByRole();

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 z-10 font-sans">
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600 tracking-tight">MediCare</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <link.icon className={clsx("mr-3 h-5 w-5 flex-shrink-0 group-hover:text-primary-500 transition-colors")} />
            {link.name}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <NavLink 
            to="/profile" 
            className={({ isActive }) => 
                clsx(
                    "flex items-center w-full p-2 rounded-lg transition-colors group",
                    isActive ? "bg-primary-50" : "hover:bg-gray-50"
                )
            }
        >
            <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold group-hover:bg-white group-hover:text-primary-700 transition-colors">
                    {user.name.charAt(0)}
                </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors">{user.name}</p>
                <p className="text-xs font-medium text-gray-500 capitalize group-hover:text-primary-600 transition-colors">View Profile</p>
            </div>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
