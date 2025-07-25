import React, { useEffect, useState, useRef } from 'react';
import {
  Clock,
  Calendar,
  BarChart2,
  Folder,
  Users,
  FileText,
  Bell,
  User,
  Home,
  UserCircle
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Button } from '@/components/ui/button';

const menuItems = [
  { name: 'Timesheet', icon: <Clock size={20} />, path: '/admin/timesheet' },
  { name: 'Calendar', icon: <Calendar size={20} />, path: '/admin/calendar' },
  { name: 'Reports', icon: <BarChart2 size={20} />, path: '/admin/reports' },
  { name: 'Projects', icon: <Folder size={20} />, path: '/admin/projects' },
  { name: 'Teams', icon: <Users size={20} />, path: '/admin/teams' },
];

const AdminTimesheet: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [projectList] = useState(['Project Alpha', 'Project Beta', 'Project Gamma']);
  const [selectedProject, setSelectedProject] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !(profileRef.current as any).contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={clsx(
          'bg-white border-r shadow-sm transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-52'
        )}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
      >
        <div className="p-4 font-bold text-green-600 text-xl">
          {collapsed ? '⏱️' : 'EMPWR'}
        </div>
        <nav className="flex flex-col mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                'flex items-center px-4 py-3 hover:bg-green-100 transition',
                location.pathname === item.path
                  ? 'bg-green-50 border-l-4 border-green-600'
                  : ''
              )}
            >
              <div className="text-green-700">{item.icon}</div>
              {!collapsed && (
                <span className="ml-3 text-gray-700">{item.name}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Area */}
      <main className="flex-1 bg-gray-50 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
            <div>
              <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
              <p className="text-base font-semibold text-gray-600">Company Calendar</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <span className="text-lg font-bold text-green-700">EMPWR</span>
            <button
              onClick={() => navigate('/notifications')}
              className="relative text-green-800 hover:text-green-900"
            >
              <Bell className="h-5 w-5" />
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(prev => !prev)}
                className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full"
              >
                <User className="w-5 h-5 text-green-700" />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg z-50">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setIsProfileOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-gray-800 hover:bg-green-50 flex items-center gap-2"
                  >
                    <UserCircle className="w-4 h-4 text-green-600" />
                    View Profile
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/admin')}
              className="w-10 h-10 flex items-center justify-center text-green-700 hover:bg-green-100 rounded-full"
              aria-label="Dashboard"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Timesheet Grid */}
        <div className="p-4">
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between mb-2">
              <h2 className="text-lg font-semibold text-green-700">Timesheet</h2>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  placeholder="Search teammate"
                  className="border border-green-500 p-1 rounded text-sm"
                />
                <input
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="border border-green-500 p-1 rounded text-sm"
                />
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-green-100">
                <tr>
                  <th className="text-left px-2 py-1">Projects</th>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <th key={d} className="px-2 py-1">{d}</th>
                  ))}
                  <th className="px-2 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-2 py-1 text-green-700">{selectedProject || 'No Project Selected'}</td>
                  <td colSpan={6}></td>
                  <td className="text-center text-green-600">00:11:26</td>
                  <td></td>
                </tr>
                <tr className="border-t">
                  <td
                    className="px-2 py-1 text-green-500 cursor-pointer hover:underline"
                    onClick={() => setShowProjectDropdown(true)}
                  >
                    + Select Project
                  </td>
                  <td colSpan={7}></td>
                  <td className="text-center text-gray-500">00:00:00</td>
                </tr>
              </tbody>
              <tfoot className="bg-green-50 border-t">
                <tr>
                  <td className="px-2 py-1 font-semibold text-green-800">Total:</td>
                  <td colSpan={7}></td>
                  <td className="text-center text-green-800 font-semibold">00:11:26</td>
                </tr>
              </tfoot>
            </table>

            {/* Project dropdown menu */}
            {showProjectDropdown && (
              <div className="absolute z-10 mt-2 bg-white border rounded shadow w-40">
                {projectList.map((proj) => (
                  <div
                    key={proj}
                    onClick={() => {
                      setSelectedProject(proj);
                      setShowProjectDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                  >
                    {proj}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <div className="text-right">
            <Button className="bg-green-600 text-white">
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminTimesheet;
