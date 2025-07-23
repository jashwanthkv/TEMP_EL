import React, { useState, useRef,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  HelpCircle,
  Book,
  BarChart2,
  LogOut,
  Lock,
} from 'lucide-react';
import Confetti from 'react-dom-confetti';
import NotificationBell from '../components/ui/NotificationBell';
import { Card, CardContent } from '@/components/ui/card';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { UserCircle } from 'lucide-react'; 
import { Bell } from 'lucide-react';



ChartJS.register(ArcElement, Tooltip, Legend);

type SidebarItem = {
  title: string;
  icon: React.ElementType;
  path?: string;
  action?: () => void;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Employee';
  const empId = localStorage.getItem('userId') || 'EMP001';
  const userEmail = localStorage.getItem('userEmail') || 'employee@gmail.com';
  const userDesignation = localStorage.getItem('userDesignation') || 'Software Engineer';
  const userDepartment = localStorage.getItem('userDepartment') || 'Technology';
  const userJoinedOn = localStorage.getItem('userJoinedOn') || '01-Jan-2024';

    const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Optional: Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  useEffect(() => {
  fetch(
    'https://script.google.com/macros/s/AKfycbx3rFLwNdhj6rqkNpTMcMuHqU18RjeG5ELhpQi0144BylNAGQ5TuT9QHDu_TX8G2jhk/exec?action=getNews'
  )
    .then((res) => res.json())
    .then((data) => {
      const formatted = data.map((item: any) => ({
        ...item,
        fullText: `${item.description}\n\nClick to read more...`,
      }));
      setNewsData(formatted);
    })
    .catch((err) => console.error('Failed to fetch news:', err));
}, []);


  // Format join date if it's in a different format
  const formatJoinDate = (dateStr: string) => {
    try {
      // Try to parse and format the date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
      return dateStr; // Return as is if parsing fails
    } catch {
      return dateStr;
    }
  };

  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const statCards = [
    { title: '6 projects', subtitle: 'Achievements🏆', color: 'text-green-600' },
    { title: '160 hrs', subtitle: 'Hours This Month', color: 'text-green-500' },
    { title: '2', subtitle: 'Pending Requests', color: 'text-red-600' },
  ];

  const sidebarItems: SidebarItem[] = [
    { title: 'Timesheet', icon: Clock, path: '/timesheet' },
    { title: 'Leave Request', icon: CalendarIcon, path: '/leave' },
    { title: 'Company Calendar', icon: CalendarIcon, path: '/calendar' },
    { title: 'Document Request', icon: Lock, path: '/requests' },
    
    { title: 'Training & Courses', icon: Book, path: '/training' },
    { title: 'Performance Review', icon: BarChart2, path: '/performance' },
    { title: 'Company Achievements', icon: BarChart2, path: '/company' },
    { title: 'Help & Support', icon: HelpCircle, path: '/help' },

  ];
  type NewsItem = {
  title: string;
  description: string;
  image: string;
  fullText: string;
};


  const confettiConfig = {
    angle: 60,
    spread: 100,
    startVelocity: 25,
    elementCount: 60,
    dragFriction: 0.12,
    duration: 2200,
    stagger: 3,
    width: '8px',
    height: '8px',
    colors: ['#00C9A7', '#FFD93D', '#FF6B6B', '#6A67CE'],
  };

  const triggerCelebration = () => {
    setShowConfetti(true);
    setShowPopup(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowConfetti(false);
      setShowPopup(false);
    }, 2000);
  };

  
  

  const leaveSummaryString = localStorage.getItem('leaveSummary');
  const leaveSummary = leaveSummaryString ? JSON.parse(leaveSummaryString) : null;

  const leaveLabels = ['Casual Leave', 'Sick Leave', 'Earned Leave'];
  const leaveValues = leaveSummary ? [leaveSummary.casual || 0, leaveSummary.sick || 0, leaveSummary.earned || 0] : [10, 3, 3];
  const totalLeaveDays = leaveValues.reduce((sum, val) => sum + val, 0);
  const leaveColors = ['#3B82F6', '#EF4444', '#10B981'];
  const [showTimeTracker, setShowTimeTracker] = useState(false);

  const leavePieData = {
    labels: leaveLabels,
    datasets: [
      {
        data: leaveValues,
        backgroundColor: leaveColors,
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8,
      },
    ],
  };

  const leavePieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
    },
  };

  const upcomingHolidays = [
    { date: '2025-08-15', event: 'Independence Day' },
    { date: '2025-09-07', event: 'Ganesh Chaturthi' },
    { date: '2025-10-02', event: 'Gandhi Jayanti' },
    { date: '2025-10-31', event: 'Diwali' },
    { date: '2025-12-25', event: 'Christmas Day' },
  ];

  const holidayDates = upcomingHolidays.map(h => new Date(h.date).toDateString());

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

    <button
  onClick={() => navigate('/notifications')}
  className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition"
>
  <Bell className="w-5 h-5 text-green-700" />
</button>

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
          navigate('/profile');
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
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md border-r flex flex-col">
          <div className="flex-1 overflow-y-auto pt-6 px-4 space-y-4">
            {sidebarItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 cursor-pointer hover:bg-green-100 p-2 rounded transition-all"
                  onClick={() => item.action ? item.action() : navigate(item.path!)}
                >
                  <Icon className="w-5 h-5 text-green-600" />
                  <span className="text-gray-800">{item.title}</span>
                </div>
              );
            })}
          </div>
       
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 py-6 overflow-y-auto">
          {showPopup && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-900 px-6 py-3 rounded-lg shadow-lg z-50 text-lg font-semibold animate-bounce">
              🎉 Congratulations on your achievements!
            </div>
          )}

         
          {/* Fixed News Ticker */}
      {/* Fixed News Ticker - Right to Left Animation */}
{/* This goes directly inside your dashboard main layout, just below the top nav */}
<div className="w-full bg-transparent px-0 -mt-2 mb-2">
  <div className="overflow-hidden w-full">
    <div className="flex animate-scroll-left items-center space-x-6 pl-4 pr-6">
      {newsData.map((item, idx) => (
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




          {/* Welcome and Working Time */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Updated Welcome Card */}
              <div className="col-span-2 bg-gradient-to-r from-[#32d399] via-[#16a085] to-[#0e7662] p-6 rounded-lg shadow flex flex-col md:flex-row items-center md:items-start gap-6">
                <img
                  src="/Dhanush.jpg"
                  alt="Profile"
                  className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-md"
                />
                <div className="text-white text-sm space-y-2 md:text-base">
                  <p className="font-bold text-xl">{userName}</p>
                  <p className="font-bold">Employee ID: {empId}</p>
                  <p className="font-bold">Designation: {userDesignation}</p>
                  <p className="font-bold">Department: {userDepartment}</p>
                  <p className="font-bold">Joined On: {formatJoinDate(userJoinedOn)}</p>
                </div>
              </div>

              {/* Working Time Card */}
              <Card className="shadow-lg h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-lg font-semibold text-green-700 mb-2">Working Time</h3>
                    <p className="text-gray-600 mb-1">This week</p>
                    <div className="text-2xl font-bold text-green-800 mb-2">43 / 48 hours</div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${(43 / 48) * 100}%` }}
                      />
                    </div>
                  </div>
                  <button
                  className="bg-green-100 text-green-800 px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-green-200 transition"
                  onClick={() => setShowTimeTracker(true)}
                >
                  <Clock className="w-4 h-4" />
                  Time Tracker
                </button>

                </CardContent>
              </Card>
            </div>
          

{showTimeTracker && (
  <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center px-4 py-10">
    <div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-6 relative">
      <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" /> Time Tracker Stats
      </h3>

      <div className="space-y-4">
        <div className="text-gray-800 text-lg">
          Worked Hours: <strong>43 hrs</strong>
        </div>
        <div className="text-gray-800 text-lg">
          Remaining Hours: <strong>5 hrs</strong>
        </div>

        {/* ✅ Enhanced Task Summary Section */}
        <div className="bg-gray-50 border p-4 rounded-md shadow-inner">
          <p className="font-semibold text-green-700 mb-3">Your Task Summary</p>
          <ul className="space-y-3 text-sm text-gray-700 max-h-60 overflow-y-auto">
            <li className="border-b pb-2">
              <div className="flex justify-between">
                <span className="font-semibold">Design Landing Page</span>
                <span className="text-xs text-gray-500">2h 30m</span>
              </div>
              <p className="text-xs text-gray-500">
                Project: EMPWR Redesign • Checked in at 09:00 AM, out at 11:30 AM
              </p>
            </li>
            <li className="border-b pb-2">
              <div className="flex justify-between">
                <span className="font-semibold">Fix Timesheet Bugs</span>
                <span className="text-xs text-gray-500">1h 45m</span>
              </div>
              <p className="text-xs text-gray-500">
                Project: Internal Tools • Checked in at 12:00 PM, out at 01:45 PM
              </p>
            </li>
            <li className="border-b pb-2">
              <div className="flex justify-between">
                <span className="font-semibold">API Integration</span>
                <span className="text-xs text-gray-500">2h</span>
              </div>
              <p className="text-xs text-gray-500">
                Project: Client Portal • Checked in at 02:00 PM, out at 04:00 PM
              </p>
            </li>
            <li>
              <div className="flex justify-between">
                <span className="font-semibold">Daily Standup</span>
                <span className="text-xs text-gray-500">15m</span>
              </div>
              <p className="text-xs text-gray-500">
                Project: EMPWR • Checked in at 10:00 AM, out at 10:15 AM
              </p>
            </li>
          </ul>
        </div>
      </div>

      <button
        onClick={() => setShowTimeTracker(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
      >
        ✕
      </button>
    </div>
  </div>
)}


          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => {
                  setHoveredCardIndex(index);
                  if (stat.subtitle.includes('Achievements')) triggerCelebration();
                }}
                onMouseLeave={() => setHoveredCardIndex(null)}
              >
                {stat.subtitle.includes('Achievements') && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[50%] pointer-events-none z-20">
                    <Confetti active={showConfetti} config={confettiConfig} />
                  </div>
                )}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.title}</div>
                    <div className="text-gray-600">{stat.subtitle}</div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          {/* Leave Summary & Holiday Calendar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Leave Summary */}
                <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between min-h-[360px]">
                  <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-green-600" />
                    Leave Summary
                  </h2>

                  <div className="flex flex-col lg:flex-row items-center justify-between gap-10 flex-1">
                    {/* Pie Chart */}
                    <div className="h-[220px] w-[220px]">
                      <Pie data={leavePieData} options={leavePieOptions} />
                    </div>

                    {/* Breakdown Cards */}
                    <div className="flex-1 flex flex-col gap-4 w-full">
                      <div className="bg-blue-50 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="text-blue-600 font-semibold">Casual Leave</p>
                          <p className="text-sm text-gray-600">Relax or handle personal matters</p>
                        </div>
                        <span className="text-2xl font-bold text-blue-700">{leaveValues[0]} days</span>
                      </div>

                      <div className="bg-red-50 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="text-red-600 font-semibold">Sick Leave</p>
                          <p className="text-sm text-gray-600">For health-related absence</p>
                        </div>
                        <span className="text-2xl font-bold text-red-600">{leaveValues[1]} days</span>
                      </div>

                      <div className="bg-green-50 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="text-green-600 font-semibold">Earned Leave</p>
                          <p className="text-sm text-gray-600">Accumulated paid leave</p>
                        </div>
                        <span className="text-2xl font-bold text-green-700">{leaveValues[2]} days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Holiday Calendar */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between min-h-[360px]">
                  <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-green-600" />
                    Upcoming Holidays
                  </h2>
                  <div className="react-calendar-wrapper rounded-xl overflow-hidden">
                    <Calendar
                     tileClassName={({ date }) => {
  const isHoliday = holidayDates.includes(date.toDateString());
  const isToday = new Date().toDateString() === date.toDateString();

  if (isHoliday) {
    return 'bg-green-700 text-white font-semibold rounded-md';
  }

  if (isToday) {
    return 'bg-blue-500 text-white font-semibold rounded-md';
  }

  return '';
}}

                      className="w-full border-none"
                    />
                  </div>
                  <ul className="mt-4 text-sm text-gray-700 space-y-1">
                    {upcomingHolidays.map((h, i) => (
                      <li key={i}>
                        <span className="font-medium text-green-800">{h.event}</span> –{' '}
                        <span className="text-gray-500">{h.date}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>



          
          {/* News Modal */}
          {selectedNews && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 py-8 overflow-auto">
              <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-4xl p-8 relative">
                <h2 className="text-3xl font-bold text-green-800 mb-4">
                  {selectedNews.title}
                </h2>

                {selectedNews.image && (
      selectedNews.image.includes('drive.google.com') ||
      /\.(pdf)$/i.test(selectedNews.image) ? (
        <iframe
          src={selectedNews.image}
          title="PDF Preview"
          className="w-full h-96 mb-6 rounded shadow"
        />
      ) : (
        <img
          src={selectedNews.image}
          alt="News"
          className="rounded-xl w-full h-64 object-cover mb-6 shadow"
        />
      )
    )}




                <p className="text-gray-800 text-lg leading-relaxed mb-8 whitespace-pre-line">
                  {selectedNews.fullText}
                </p>

                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedNews(null)}
                    className="bg-green-100 text-green-800 px-6 py-2 rounded hover:bg-green-200 transition text-base font-semibold"
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

export default Dashboard;

