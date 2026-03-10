import { LogOut, Bell, Search, Building2, ChevronDown, CheckCircle2, ShieldAlert, FileText, Settings2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setActiveHospital } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { useGetHospitalsQuery } from '../../features/admin/hospitalsApi';
import { apiSlice } from '../../app/apiSlice';
import type { RootState } from '../../app/store';
import type { Hospital } from '../../types';
import { useSocket } from '../../hooks/useSocket';
import { useState, useEffect, useRef } from 'react';

interface Notification {
    id: string;
    type: 'report' | 'consent' | 'security';
    message: string;
    time: string;
    read: boolean;
}

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, activeHospitalId } = useSelector((state: RootState) => state.auth);
  const { data: hospitals = [] } = useGetHospitalsQuery();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const socket = useSocket();

  // Listen for socket events
  useEffect(() => {
      if (!socket) return;

      const addNotification = (type: Notification['type'], data: { message: string }) => {
          setNotifications(prev => [{
              id: Date.now().toString() + Math.random(),
              type,
              message: data.message,
              time: new Date().toISOString(),
              read: false
          }, ...prev]);
      };

      socket.on('NEW_REPORT', (data) => addNotification('report', data));
      socket.on('CONSENT_CHANGED', (data) => addNotification('consent', data));
      socket.on('SECURITY_ALERT', (data) => addNotification('security', data));

      return () => {
          socket.off('NEW_REPORT');
          socket.off('CONSENT_CHANGED');
          socket.off('SECURITY_ALERT');
      };
  }, [socket]);

  // Click outside to close notifications
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
      setNotifications(prev => prev.map(n => ({...n, read: true})));
  };
  
  // Filter available hospitals based on user's authorized IDs
  const userHospitalIds = user?.hospitalIds?.map(h => typeof h === 'object' ? String((h as any)._id || h.id) : String(h)) || [];
  const authorizedHospitals = user?.role === 'super_admin' 
    ? hospitals 
    : hospitals.filter((h: Hospital) => userHospitalIds.includes(String(h._id || h.id)));

  const currentHospital = hospitals.find((h: Hospital) => String(h._id || h.id) === activeHospitalId);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleContextChange = (hospitalId: string) => {
    dispatch(setActiveHospital(hospitalId));
    // Immediately invalidate all tags so the UI components refetch with new headers
    dispatch(apiSlice.util.invalidateTags(['Users', 'Patients', 'Records', 'Reports', 'Appointments', 'Activity']));
  };

  const getNotificationIcon = (type: string) => {
      switch(type) {
          case 'security': return <ShieldAlert className="w-5 h-5 text-red-500" />;
          case 'report': return <FileText className="w-5 h-5 text-blue-500" />;
          case 'consent': return <Settings2 className="w-5 h-5 text-emerald-500" />;
          default: return <Bell className="w-5 h-5 text-gray-500" />;
      }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 pl-72 sticky top-0 z-10 w-full">
        {/* Search Placeholder */}
        <div className="flex-1 max-w-lg">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
                    placeholder="Search records..."
                    type="search"
                />
            </div>
        </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        
        {/* Context Selector for Admins/Doctors with multiple facilities */}
        {authorizedHospitals.length > 1 && user?.role !== 'patient' && user?.role !== 'super_admin' && (
            <div className="relative group/context flex flex-col justify-center border-r border-gray-200 pr-4 mr-2">
                <div className="flex items-center space-x-2 text-sm text-gray-500 cursor-pointer hover:text-gray-900">
                    <div className="bg-primary-50 p-1.5 rounded-lg text-primary-600">
                        <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Active Context</span>
                        <span className="font-semibold text-gray-700 flex items-center gap-1">
                            {currentHospital?.name || 'Select Facility...'}
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                        </span>
                    </div>
                </div>

                {/* Dropdown menu */}
                <div className="absolute right-4 top-full pt-2 w-64 opacity-0 invisible group-hover/context:opacity-100 group-hover/context:visible transition-all group-hover/context:pointer-events-auto origin-top-right z-50">
                    <div className="bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 p-2 space-y-1">
                        {authorizedHospitals.map((h: Hospital) => {
                            const isSelected = String(h._id || h.id) === activeHospitalId;
                            return (
                                <button
                                    key={String(h._id || h.id)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between group/btn transition-colors ${
                                        isSelected 
                                            ? 'bg-primary-50 text-primary-700 font-semibold' 
                                            : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                    onClick={() => handleContextChange(String(h._id || h.id))}
                                >
                                    <span className="truncate">{h.name}</span>
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(14,165,233,1)]"></span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        <div className="relative" ref={notifRef}>
            <button 
                className="p-2 text-gray-400 hover:text-gray-500 relative transition-transform hover:scale-105 active:scale-95"
                onClick={() => setShowNotifications(!showNotifications)}
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                    <CheckCircle2 className="w-6 h-6 text-gray-400" />
                                </div>
                                You're all caught up!
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(notif => (
                                    <div key={notif.id} className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 ${notif.read ? 'opacity-60' : 'bg-blue-50/20'}`}>
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 leading-snug">{notif.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(notif.time).toLocaleTimeString([], {timeStyle: 'short'})}
                                            </p>
                                        </div>
                                        {!notif.read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5 shadow-sm"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="h-8 w-px bg-gray-200 mx-2"></div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
