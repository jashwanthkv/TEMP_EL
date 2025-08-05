import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Bell, Home, User, UserCircle, LogOut, Lock, Settings, HelpCircle, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RequireLogin from '@/components/ui/RequireLogin';

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
  { label: 'Backup & Restore', key: 'backup-restore', icon: Database },
  { label: 'Change Password', key: 'change-password', icon: Lock },
  { label: 'Help & Support', key: 'feedback-support', icon: HelpCircle },
];

const AdminSettings = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  const navigate = useNavigate();
  const [selected, setSelected] = useState(sections[0].key);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const renderContent = () => {
    switch (selected) {
      case 'backup-restore':
        return <BackupRestore />;
      case 'change-password':
        return <ChangePassword />;
      case 'feedback-support':
        return <FeedbackSupport />;
      default:
        return null;
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-brand leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-muted-foreground">Admin Settings</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <span className="text-lg font-bold text-brand">EMPWR</span>

          <button
                            onClick={() => navigate('/admin/notifications')}
                            className="relative text-green-800 hover:text-green-900"
                          >
                            <Bell className="h-5 w-5" />
                          </button>
          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(prev => !prev)}
              className="w-10 h-10 flex items-center justify-center hover:bg-brand-light rounded-full transition-colors"
            >
              <User className="w-5 h-5 text-brand" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-card shadow-lg rounded-lg z-50 border border-border">
                <button
                  onClick={() => {
                    navigate('/admin/profile');
                    setIsProfileOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-card-foreground hover:bg-brand-light flex items-center gap-2 transition-colors"
                >
                  <UserCircle className="w-4 h-4 text-brand" />
                  View Profile
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => navigate('/admin')} 
            className="text-brand hover:bg-brand-light p-2 rounded-full transition-colors"
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex gap-4 p-6">
        {/* Collapsible Sidebar */}
        <div
          className={`relative bg-card border border-border rounded-lg shadow-sm transition-all duration-300 ease-in-out ${
            isSidebarHovered ? 'w-64' : 'w-16'
          }`}
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
        >
          <div className="p-3 space-y-2">
            {sections.map((sec) => {
              const IconComponent = sec.icon;
              return (
                <Card
                  key={sec.key}
                  onClick={() => setSelected(sec.key)}
                  className={`flex items-center cursor-pointer transition-all duration-200 hover:shadow-md p-3 rounded-md group ${
                    selected === sec.key 
                      ? 'bg-brand-light border-brand shadow-sm' 
                      : 'border-transparent hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center min-w-0 w-full">
                <IconComponent className="h-5 w-5 flex-shrink-0 text-green-600" />

                    <span
                      className={`ml-3 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                        selected === sec.key ? 'text-brand-text' : 'text-card-foreground'
                      } ${
                        isSidebarHovered 
                          ? 'opacity-100 translate-x-0' 
                          : 'opacity-0 -translate-x-2 pointer-events-none'
                      }`}
                    >
                      {sec.label}
                    </span>
                  </div>
                </Card>
              );
            })}

            {/* Logout Button */}
            <Card
              onClick={() => {
                localStorage.clear();
                navigate('/');
              }}
              className="flex items-center cursor-pointer transition-all duration-200 hover:shadow-md p-3 rounded-md bg-destructive/10 hover:bg-destructive/20 border-destructive/20 group"
            >
              <div className="flex items-center min-w-0 w-full">
                <LogOut className="h-5 w-5 flex-shrink-0 text-destructive" />
                <span
                  className={`ml-3 text-sm font-medium text-destructive transition-all duration-300 whitespace-nowrap ${
                    isSidebarHovered 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-2 pointer-events-none'
                  }`}
                >
                  Logout
                </span>
              </div>
            </Card>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <Card className="shadow-sm border border-border h-full">
            <CardContent className="p-6 h-full">
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;