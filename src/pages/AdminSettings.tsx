import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Home, Bell, User, UserCircle } from 'lucide-react';



import UpdateProfile from '@/components/ui/UpdateProfile';
import CompanyInfo from '@/components/ui/CompanyInfo';
import WorkingHours from '@/components/ui/WorkingHours';
import TimesheetSettings from '@/components/ui/TimesheetSettings';
import ModulesToggle from '@/components/ui/ModulesToggle';
import BackupRestore from '@/components/ui/BackupRestore';
import ChangePassword from '@/components/ui/ChangePassword';
import NotificationsSettings from '@/components/ui/NotificationsSettings';
import FeedbackSupport from '@/components/ui/FeedbackSupport';


const sections = [
  { label: '👤 Update Profile', key: 'update-profile' },
  { label: '🏢 Company Info', key: 'company-info' },
  { label: '🕑 Working Hours', key: 'working-hours' },
  { label: '🧮 Timesheet Settings', key: 'timesheet-settings' },
  { label: '📦 Modules Toggle', key: 'modules-toggle' },
  { label: '🔄 Backup & Restore', key: 'backup-restore' },
  { label: '🔒 Change Password', key: 'change-password' },
  { label: '📧 Notification Preferences', key: 'notifications' },
  { label: '🛠️ Feedback & Support', key: 'feedback-support' },
];

const AdminSettings = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(sections[0].key);

  const renderContent = () => {
    switch (selected) {
      case 'update-profile': return <UpdateProfile />;
      case 'company-info': return <CompanyInfo />;
      case 'working-hours': return <WorkingHours />;
      case 'timesheet-settings': return <TimesheetSettings />;
      case 'modules-toggle': return <ModulesToggle />;
      case 'backup-restore': return <BackupRestore />;
      case 'change-password': return <ChangePassword />;
      case 'notifications': return <NotificationsSettings />;
      case 'feedback-support': return <FeedbackSupport />;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Admin Settings</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <span className="text-lg font-bold text-green-700">EMPWR</span>

          <button className="relative text-green-700 hover:text-green-800">
            <Bell className="h-6 w-6" />
          </button>
          <div className="relative group">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full">
              <User className="w-5 h-5 text-green-700" />
            </button>
            <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transform transition-all duration-200 z-50">
              <button
                onClick={() => navigate('/profile')}
                className="w-full px-4 py-2 text-left text-gray-800 hover:bg-green-50 flex items-center gap-2"
              >
                <UserCircle className="w-4 h-4 text-green-600" />
                View Profile
              </button>
            </div>
          </div>

          <button onClick={() => navigate('/admin')} className="text-green-700 hover:bg-green-100 p-2 rounded-full transition">
            <Home className="h-5 w-5" />
          </button>

          
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="space-y-2">
          {sections.map(sec => (
            <Card
              key={sec.key}
              className={`p-4 cursor-pointer transition hover:shadow-md rounded ${
                selected === sec.key ? 'bg-blue-50 border-blue-500' : ''
              }`}
              onClick={() => setSelected(sec.key)}
            >
              {sec.label}
            </Card>
          ))}
          <Card
            className="p-4 cursor-pointer transition hover:shadow-md rounded bg-red-50 text-red-600"
            onClick={() => {
              localStorage.clear();
              navigate('/');
            }}
          >
            🚪 Logout
          </Card>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <Card className="shadow border">
            <CardContent className="p-6">
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
