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
  TrendingUp,
  AlertTriangle,
  Shield,
  Activity,
  Plus,
  Eye,
  UserCheck,
  FileCheck,
  Timer,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  AreaChart,
  Area,
} from 'recharts';

import { useNavigate } from 'react-router-dom';
import NotificationBell from '@/components/ui/NotificationBell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


const AdminPanel = () => {
  const navigate = useNavigate();
  const [selectedNews, setSelectedNews] = useState<any>(null);

  const statCards = [
    { 
      title: '45', 
      subtitle: 'Total Employees', 
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      trend: '+5 this month'
    },
    { 
      title: '8', 
      subtitle: 'Pending Leaves', 
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      trend: '3 urgent'
    },
    { 
      title: '12', 
      subtitle: 'Active Projects', 
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '87% on track'
    },
    { 
      title: '24', 
      subtitle: 'Documents Pending', 
      icon: FileCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: '6 require review'
    },
  ];

  const sidebarItems = [
    { title: 'Manage Employees', icon: Users, path: '/manage-employees' },
    { title: 'Manage Leaves', icon: CheckCircle, path: '/admin/leaves' },
    { title: 'Project Management', icon: Clock, path: '/admin/timesheet' },
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

  // Recent activities data
  const recentActivities = [
    { id: 1, user: 'John Doe', action: 'submitted leave request', time: '2 minutes ago', status: 'pending' },
    { id: 2, user: 'Sarah Smith', action: 'completed training module', time: '15 minutes ago', status: 'completed' },
    { id: 3, user: 'Mike Johnson', action: 'uploaded timesheet', time: '1 hour ago', status: 'approved' },
    { id: 4, user: 'Emily Davis', action: 'requested document approval', time: '2 hours ago', status: 'pending' },
    { id: 5, user: 'Alex Wilson', action: 'marked project milestone', time: '3 hours ago', status: 'completed' },
  ];

  // Department statistics
  const departmentStats = [
    { name: 'Engineering', employees: 18, color: 'bg-blue-500' },
    { name: 'Marketing', employees: 12, color: 'bg-green-500' },
    { name: 'Sales', employees: 10, color: 'bg-purple-500' },
    { name: 'HR', employees: 5, color: 'bg-orange-500' },
  ];

  // Quick actions
  const quickActions = [
    { title: 'Add Employee', icon: Plus, action: () => navigate('/manage-employees'), color: 'bg-green-500' },
    { title: 'Review Leaves', icon: Eye, action: () => navigate('/admin/leaves'), color: 'bg-blue-500' },
    { title: 'Approve Documents', icon: FileCheck, action: () => navigate('/admin/payslips'), color: 'bg-purple-500' },
    { title: 'Manage News', icon: Activity, action: () => navigate('/admin/news'), color: 'bg-orange-500' },
  ];

  // Fetch admin details from localStorage
  const adminName = localStorage.getItem('userName') || localStorage.getItem('adminName') || 'Admin';
  const adminId = localStorage.getItem('userId') || localStorage.getItem('adminId') || 'ADMIN001';
  const adminDesignation = localStorage.getItem('userDesignation') || localStorage.getItem('adminDesignation') || 'HR Manager';
  const adminDepartment = localStorage.getItem('userDepartment') || localStorage.getItem('adminDepartment') || 'Human Resources';
  const adminJoinedOn = localStorage.getItem('userJoinedOn') || localStorage.getItem('adminJoinedOn') || '01-Jan-2024';
  const [selectedProject, setSelectedProject] = useState<string>('Project A');

  const projectList = [
    'Project A', 'Project B', 'Project C', 'Project D', 'Project E'
  ];

  const weeklyProjectBreakdown: Record<string, { day: string; hours: number }[]> = {
    'Project A': [
      { day: 'Mon', hours: 4 }, { day: 'Tue', hours: 6 }, { day: 'Wed', hours: 5 },
      { day: 'Thu', hours: 7 }, { day: 'Fri', hours: 5 },
    ],
    'Project B': [
      { day: 'Mon', hours: 5 }, { day: 'Tue', hours: 5 }, { day: 'Wed', hours: 5 },
      { day: 'Thu', hours: 5 }, { day: 'Fri', hours: 5 },
    ],
    'Project C': [
      { day: 'Mon', hours: 2 }, { day: 'Tue', hours: 3 }, { day: 'Wed', hours: 4 },
      { day: 'Thu', hours: 3 }, { day: 'Fri', hours: 4 },
    ],
    'Project D': [
      { day: 'Mon', hours: 3 }, { day: 'Tue', hours: 4 }, { day: 'Wed', hours: 4 },
      { day: 'Thu', hours: 3 }, { day: 'Fri', hours: 5 },
    ],
    'Project E': [
      { day: 'Mon', hours: 6 }, { day: 'Tue', hours: 5 }, { day: 'Wed', hours: 6 },
      { day: 'Thu', hours: 5 }, { day: 'Fri', hours: 6 },
    ],
  };

  const [clickedBar, setClickedBar] = useState<{ day: string; hours: number } | null>(null);


     
   
  // Fetch admin image using profile.js logic
  const [adminPhotoUrl, setAdminPhotoUrl] = React.useState<string | null>(null);
  useEffect(() => {
    const empId = localStorage.getItem('userId') || localStorage.getItem('EMP_ID');
    const role = localStorage.getItem('userRole') === 'admin' ? 'Admin' : 'Employees';
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbz0b9c2rTYUGRSyVbbsXVcnenIFOIbsuQY2JrvP_Ar65QW1fIJcv61Y39aXA-VOing0dg/exec';
    if (!empId) return;
    fetch(`${scriptUrl}?EMP_ID=${empId}&role=${role}`)
      .then(res => res.json())
      .then(data => {
        if (data.IMAGE_URL) {
          fetch(`${scriptUrl}?fileId=${data.IMAGE_URL}`)
            .then(res => res.text())
            .then(dataUri => setAdminPhotoUrl(dataUri))
            .catch(() => setAdminPhotoUrl(null));
        } else {
          setAdminPhotoUrl(null);
        }
      })
      .catch(() => setAdminPhotoUrl(null));
  }, []);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pending</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Approved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="bg-card shadow-sm border-b border-border px-6 py-4 flex justify-between items-center">
        {/* Left section: Logo and company name */}
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="EMPWR Logo" className="h-10 w-auto object-contain" />
          <span className="text-lg font-bold text-[#0e7662]">EPICAL LAYOUTS PVT LTD</span>
        </div>

        {/* Right section: Company name + notification + profile */}
        <div className="flex items-center space-x-6">
          <span className="text-lg font-bold text-[#0e7662] hidden lg:block">
            EMPWR - Employee Management Platform for Workforce and Reporting
          </span>

          <NotificationBell />
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(prev => !prev)}
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <User className="w-5 h-5 text-primary" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-card shadow-lg rounded-lg z-50 border border-border">
                <button
                  onClick={() => {
                    navigate('/admin/profile');
                    setIsProfileOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-card-foreground hover:bg-muted flex items-center gap-2 rounded-t-lg"
                >
                  <UserCircle className="w-4 h-4 text-primary" />
                  View Profile
                </button>

                <div className="border-t border-border my-1" />

                <button
                  onClick={() => {
                    localStorage.clear();
                    navigate('/');
                  }}
                  className="w-full px-4 py-2 text-left text-destructive hover:bg-destructive/10 flex items-center gap-2 rounded-b-lg"
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
        <aside className="w-64 bg-card shadow-md border-r border-border flex flex-col">
          <div className="flex-1 overflow-y-auto pt-6 px-4 space-y-2">
            {sidebarItems.map((item, idx) => (
              <div
              key={idx}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors hover:bg-[#d1fae5]"
            >
              <item.icon className="w-5 h-5 text-[#0e7662]" />
              <span className="text-gray-800 text-sm leading-snug break-words">{item.title}</span>

            </div>

            ))}
          </div>
        </aside>

        <main className="flex-1 px-6 py-6 overflow-y-auto">
          {/* Scrolling news banner */}
          <div className="mb-6 overflow-hidden">
  <div className="relative w-full">
    <div className="flex space-x-6 animate-scroll-x px-4">
      {[...newsData, ...newsData].map((item, idx) => (
        <div
          key={idx}
          onClick={() => setSelectedNews(item)}
          className="min-w-[300px] bg-gradient-to-r from-[#32d399] via-[#16a085] to-[#0e7662] text-white font-semibold text-base px-6 py-3 rounded-lg shadow-md cursor-pointer hover:brightness-110 transition whitespace-nowrap"
        >
          {item.title}
        </div>
      ))}
    </div>
  </div>
</div>


          {/* Admin profile section and quick links */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="col-span-2 bg-gradient-to-r from-[#32d399] via-[#16a085] to-[#0e7662] p-6 rounded-lg shadow flex flex-col md:flex-row items-center md:items-start gap-6">
              {adminPhotoUrl ? (
                <img
                  src={adminPhotoUrl}
                  alt="Admin"
                  className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-white/20 flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-md">
                  {adminName ? adminName[0] : 'A'}
                </div>
              )}
              <div className="text-primary-foreground text-sm space-y-2 md:text-base">
                <p className="font-bold text-xl">{adminName}</p>
                <p className="font-bold">Admin ID: {adminId}</p>
                <p className="font-bold">Designation: {adminDesignation}</p>
                <p className="font-bold">Department: {adminDepartment}</p>
                <p className="font-bold">Joined On: {adminJoinedOn.split('T')[0]}</p>
              </div>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`${action.color} text-white p-3 rounded-lg hover:opacity-90 transition-opacity flex flex-col items-center gap-2 text-sm font-medium`}
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="text-xs text-center">{action.title}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Statistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.title}</div>
                  <div className="text-muted-foreground text-sm mb-2">{stat.subtitle}</div>
                  <div className="text-xs text-muted-foreground">{stat.trend}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dashboard content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-primary">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Weekly Project Analytics
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  {/* LEFT SIDE: Summary Section */}
                  <div className="space-y-4">
                    {selectedProject && (() => {
                      const weeklyData = weeklyProjectBreakdown[selectedProject] || [];
                      const totalWeeklyHours = weeklyData.reduce((sum, entry) => sum + entry.hours, 0);
                      const averageMonthlyHours = totalWeeklyHours * 4;

                      return (
                        <div className="space-y-3">
                          <div className="bg-gradient-to-r from-[#5eead4] via-[#2dd4bf] to-[#14b8a6] text-white p-4 rounded-lg shadow">
                            <p className="text-sm">Selected Project</p>
                            <p className="text-xl font-bold">{selectedProject}</p>
                          </div>
                          <div className="bg-muted p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500">Total Weekly Hours</p>
                            <p className="text-xl font-bold text-primary">{totalWeeklyHours} hrs</p>
                          </div>
                          <div className="bg-muted p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500">Average Monthly Hours</p>
                            <p className="text-xl font-bold text-primary">{averageMonthlyHours} hrs</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* RIGHT SIDE: Enhanced Bar Chart */}
                  <div className="col-span-2 w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={weeklyProjectBreakdown[selectedProject]}
                        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#5eead4" stopOpacity={1}/>
                            <stop offset="30%" stopColor="#2dd4bf" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity={1}/>
                          </linearGradient>
                          <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffffff" stopOpacity={1}/>
                            <stop offset="50%" stopColor="#38bdf8" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={1}/>
                          </linearGradient>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge> 
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="rgba(255, 255, 255, 0.1)" 
                          opacity={0.6} 
                          strokeWidth={1}
                        />
                        <XAxis 
                          dataKey="day" 
                          stroke="#64748b" 
                          fontSize={13} 
                          fontWeight={600}
                          axisLine={true} 
                          tickLine={false}
                          tick={{ fill: '#475569', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12} 
                          fontWeight={500}
                          axisLine={true} 
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          domain={[0, 'dataMax + 1']}
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
                            border: 'none',
                            borderRadius: '16px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            backdropFilter: 'blur(16px)',
                            padding: '12px 16px'
                          }}
                          labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '4px' }}
                          itemStyle={{ color: '#14b8a6', fontWeight: 600 }}
                          cursor={{ 
                            fill: 'rgba(20, 184, 166, 0.08)', 
                            stroke: 'rgba(251, 251, 251, 1)',
                            strokeWidth: 2,
                            radius: 8 
                          }}
                          animationDuration={300}
                        />
                       <Bar
                        dataKey="hours"
                        fill="url(#barGradient)"
                        radius={[16, 16, 6, 6]}
                        barSize={48}
                        animationDuration={1000}
                        animationBegin={100}
                        animationEasing="ease-out"
                        filter="url(#glow)"
                        className="drop-shadow-lg hover:drop-shadow-2xl transition-all duration-500"
                        onClick={(data, index) => setClickedBar(data)}
                      />
                      </BarChart>
                    </ResponsiveContainer>
                    {clickedBar && (
                      <div className="flex justify-center mt-4">
                        <div className="bg-white/90 border border-primary/20 rounded-xl shadow px-6 py-3 text-center">
                          <p className="text-sm text-gray-600">You clicked on:</p>
                          <p className="text-lg font-semibold text-primary">
                            {clickedBar.day} – {clickedBar.hours} hours worked
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>



        {/* Replace Department Overview with Project List */}
        <Card className="shadow-lg">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-primary">
      <BarChart2 className="w-5 h-5 text-primary" />
      Projects Undergoing
    </CardTitle>
  </CardHeader>

  <CardContent>
    <div className="space-y-3">
      {projectList.map((project, idx) => {
        const weeklyData = weeklyProjectBreakdown[project] || [];
        const totalHours = weeklyData.reduce((sum, entry) => sum + entry.hours, 0);
        const isSelected = selectedProject === project;

        return (
          <div
            key={idx}
            onClick={() => {
            setSelectedProject(project);
            setClickedBar(null); // clear previous bar selection
          }}

            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              isSelected
                ? 'bg-gradient-to-r from-[#5eead4] via-[#2dd4bf] to-[#14b8a6] text-white shadow-lg'
                : 'bg-muted hover:bg-muted/70 text-gray-800 border-muted'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-semibold">{project}</h4>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  totalHours >= 30
                    ? 'bg-green-100 text-green-800'
                    : totalHours >= 15
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {totalHours} hrs this week
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div
                className={`h-2 rounded-full ${
                  totalHours >= 30
                    ? 'bg-green-500'
                    : totalHours >= 15
                    ? 'bg-gray-400'
                    : 'bg-red-400'
                }`}
                style={{ width: `${(totalHours / 40) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </CardContent>
</Card>

          </div>

          {/* News modal */}
          {selectedNews && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 overflow-auto">
              <div className="bg-card rounded-2xl shadow-xl w-[90%] max-w-5xl p-8 relative border border-border">
                <h2 className="text-3xl font-bold text-primary mb-4">{selectedNews.title}</h2>
                {selectedNews.image && (
                  <img
                    src={selectedNews.image}
                    alt="News"
                    className="rounded-xl w-full h-64 object-cover mb-6 shadow-md"
                  />
                )}
                <p className="text-card-foreground text-lg leading-relaxed mb-8 whitespace-pre-line">
                  {selectedNews.fullText}
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedNews(null)}
                    className="bg-primary/10 text-primary px-6 py-2 rounded-lg hover:bg-primary/20 transition-colors font-semibold"
                  >
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