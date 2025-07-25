
import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  Bell,
  User,
  UserCircle,
  Users,
  CheckCircle,
  HelpCircle,
  Upload,
  Clock,
  BarChart2,
  BarChart3,
  Calendar,
  Settings,
  LogOut,
  Book,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '@/components/ui/NotificationBell'; // or correct path

import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [selectedNews, setSelectedNews] = useState(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const statCards = [
    { title: '45', subtitle: 'Total Employees', color: 'text-[#32d399]' },
    { title: '8', subtitle: 'Pending Leaves', color: 'text-[#FF6B6B]' },
    { title: '12', subtitle: 'Active Projects', color: 'text-[#6A67CE]' },
  ];

  const sidebarItems = [
    { title: 'Manage Employees', icon: Users, path: '/manage-employees' },
    { title: 'Manage Leaves', icon: CheckCircle, path: '/admin/leaves' },
    { title: 'Time sheet', icon: Clock, path: '/admin/timesheet' },
    { title: 'Performance Review', icon: BarChart3, path: '/admin/performance' },
    { title: 'Company Calendar', icon: Calendar, path: '/admin/calendar' },
    { title: 'Training & Courses', icon: Book, path: '/admin/training' },
    { title: 'Company Achievements', icon: BarChart2, path: '/admin/company' },
    { title: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { title: 'Upload Documents', icon: Upload, path: '/admin/payslips' },
    { title: 'Manage News', icon: FileText, path: '/admin/news' },
    { title: 'Ticket', icon: HelpCircle, path: '/admin/ticket' },
    { title: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const newsData = [
    {
      title: '📰 Monthly payroll processed by 25th',
      description: 'Payroll deadline reminder',
      image: '/payroll.jpg',
      fullText: 'Payroll for the month will be completed by 25th.'
    },
    {
      title: '🚨 Team review meeting this Friday',
      description: 'Scheduled for 3 PM',
      image: '/meeting.jpg',
      fullText: 'Team-wide review meeting will be held this Friday at 3 PM.'
    },
    {
      title: '📢 Remote Work HR Policy Updated',
      description: 'Effective immediately',
      image: '/remote-work.jpg',
      fullText: 'New HR policy for remote work is effective immediately.'
    },
  ];

  const adminName = localStorage.getItem('adminName') || 'Admin';
  const adminId = localStorage.getItem('adminId') || 'ADMIN001';
  const adminDesignation = localStorage.getItem('adminDesignation') || 'HR Manager';
  const adminDepartment = localStorage.getItem('adminDepartment') || 'Human Resources';
  const adminJoinedOn = localStorage.getItem('adminJoinedOn') || '01-Jan-2024';
  const adminPhotoUrl = localStorage.getItem('adminProfilePhotoUrl');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
const profileRef = useRef<HTMLDivElement>(null);

// Close dropdown when clicking outside
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
      setIsProfileOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


  const checkIns = [
    { day: 'Mon', count: 40 },
    { day: 'Tue', count: 45 },
    { day: 'Wed', count: 38 },
    { day: 'Thu', count: 44 },
    { day: 'Fri', count: 50 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
  {/* Left section: Logo and EMPWR label */}
  <div className="flex items-center gap-3">
    <img src="/logos.png" alt="EMPWR Logo" className="h-10 w-auto object-contain" />
    <span className="text-lg font-bold text-green-700">EPICAL LAYOUTS PVT LTD</span>
  </div>

  {/* Right section: Company name + notification + profile */}
  <div className="flex items-center space-x-6">
   <span className="text-lg font-bold text-green-700">EMPWR - Employee Management Platform for Workforce and Reporting</span>

    <NotificationBell />
    <div className="relative" ref={profileRef}>
  <button
    onClick={() => setIsProfileOpen(prev => !prev)}
    className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition"
  >
    <User className="w-5 h-5 text-green-700" />
  </button>

  {isProfileOpen && (
    <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg z-50">
      {/* View Profile */}
      <button
        onClick={() => {
          navigate('/admin/profile');
          setIsProfileOpen(false);
        }}
        className="w-full px-4 py-2 text-left text-gray-800 hover:bg-green-50 flex items-center gap-2"
      >
        <UserCircle className="w-4 h-4 text-green-600" />
        View Profile
      </button>

      <div className="border-t border-gray-200 my-1" />

      {/* Logout */}
      <button
        onClick={() => {
          localStorage.clear();
          navigate('/');
        }}
        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  )}
</div>

  </div>
</header>

      <div className="flex flex-1">
        <aside className="w-64 bg-white shadow-md border-r flex flex-col">
          <div className="flex-1 overflow-y-auto pt-6 px-4 space-y-4">
            {sidebarItems.map((item, idx) => (
              <div key={idx} onClick={() => navigate(item.path)} className="flex items-center gap-3 cursor-pointer hover:bg-[#32d399]/10 p-2 rounded transition">
                <item.icon className="w-5 h-5 text-[#32d399]" />
                <span className="text-gray-800">{item.title}</span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div onClick={handleLogout} className="flex items-center gap-3 cursor-pointer hover:bg-[#FF6B6B]/10 p-2 rounded transition">
              <LogOut className="w-5 h-5 text-[#FF6B6B]" />
              <span className="text-[#FF6B6B] font-semibold">Logout</span>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-6 py-6 overflow-y-auto">
          <div className="mb-6 overflow-hidden">
            <div className="relative w-full">
              <div className="flex space-x-6 animate-scroll-x px-4">
                {[...newsData, ...newsData].map((item, idx) => (
                  <div key={idx} onClick={() => setSelectedNews(item)} className="min-w-[300px] bg-gradient-to-r from-[#32d399] via-[#16a085] to-[#0e7662] text-white font-semibold text-md px-6 py-3 rounded-lg shadow-md cursor-pointer hover:brightness-110 transition">
                    {item.title}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="col-span-2 bg-gradient-to-r from-[#32d399] via-[#16a085] to-[#0e7662] p-6 rounded-lg shadow flex flex-col md:flex-row items-center md:items-start gap-6">
              <img src={adminPhotoUrl || '/Dhanush.jpg'} alt="Admin" className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-md" />
              <div className="text-white text-sm space-y-2 md:text-base">
                <p className="font-bold text-xl">{adminName}</p>
                <p className="font-bold">Admin ID: {adminId}</p>
                <p className="font-bold">Designation: {adminDesignation}</p>
                <p className="font-bold">Department: {adminDepartment}</p>
                <p className="font-bold">Joined On: {adminJoinedOn}</p>
              </div>
            </div>

            <Card className="shadow-lg h-full">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <h3 className="text-lg font-semibold text-[#32d399] mb-2">Quick Links</h3>
                <p className="text-gray-600 text-sm">Use the sidebar to manage employees, documents, and more.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.title}</div>
                  <div className="text-gray-600">{stat.subtitle}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-700 mb-4">Weekly Check-Ins</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={checkIns} barSize={40}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none' }} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} background={false}>
                      {checkIns.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill="#32d399"
                          className="transition-transform duration-500 hover:scale-110"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {selectedNews && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 py-8 overflow-auto">
              <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-5xl p-8 relative">
                <h2 className="text-3xl font-bold text-green-800 mb-4">{selectedNews.title}</h2>
                {selectedNews.image && (
                  <img src={selectedNews.image} alt="News" className="rounded-xl w-full h-64 object-cover mb-6 shadow" />
                )}
                <p className="text-gray-800 text-lg leading-relaxed mb-8 whitespace-pre-line">
                  {selectedNews.fullText}
                </p>
                <div className="flex justify-end">
                  <button onClick={() => setSelectedNews(null)} className="bg-green-100 text-green-800 px-6 py-2 rounded hover:bg-green-200 transition text-base font-semibold">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
