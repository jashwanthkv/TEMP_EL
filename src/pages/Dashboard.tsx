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
import { useAuth } from '@/context/AuthContext';
import RequireLogin from '@/components/ui/RequireLogin';

ChartJS.register(ArcElement, Tooltip, Legend);

type SidebarItem = {
  title: string;
  icon: React.ElementType;
  path?: string;
  action?: () => void;
};

const Dashboard = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  // State for monthly hours
  const [monthHours, setMonthHours] = useState<number | null>(null);
  const [monthTarget, setMonthTarget] = useState(192); // Default: 48*4
  const [monthLoading, setMonthLoading] = useState(true);

  // Timesheet backend URL
  const TIMESHEET_URL = "https://script.google.com/macros/s/AKfycbyo3pCBPS_ZvK6h4kQbmOU_cZtUnEr4Lw_SbuPZ9Zi3C6pLsk0CFxMYA196bvFwY0XcvA/exec";

  // State for working hours
  const [weekHours, setWeekHours] = useState<number | null>(null);
  const [weekTarget, setWeekTarget] = useState(48); // Default target
  const [weekLoading, setWeekLoading] = useState(true);

  // State for pending requests and loading
  const [pendingLeaveCount, setPendingLeaveCount] = useState<number | null>(null);
  const [pendingDocCount, setPendingDocCount] = useState<number | null>(null);
  const [pendingLoading, setPendingLoading] = useState(true);
  const { logout } = useAuth();

  // Apps Script URLs for leave and document requests
  const LEAVE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwiM7SKXbTc0EYAqDqUjRrwzJq8c2_8gYVd_tOi85TV1TRlqSxYI7x91YG4gHt65d5HWw/exec';
  const DOC_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzcgXozG8UVlaZLUXe3BMJ_TrPS-VMBtkWftPOoUwJSq3ct1GHPAcfJ5Ly7hkcOfCFDXg/exec';

  // Fetch pending leave requests
  useEffect(() => {
    const fetchPendingLeave = async () => {
      const sheetId = localStorage.getItem('spreadsheetId') || '';
      if (!sheetId) {
        setPendingLeaveCount(0);
        setPendingLoading(false);
        return;
      }
      try {
        const callbackName = 'pendingLeaveCallback_' + Math.round(100000 * Math.random());
        await new Promise((resolve, reject) => {
          (window as any)[callbackName] = (data: any) => {
            if (Array.isArray(data)) {
              setPendingLeaveCount(data.filter((entry: any) => entry.status?.toLowerCase() === 'pending').length);
            } else if (data.leaveHistory) {
              setPendingLeaveCount((data.leaveHistory as any[]).filter((entry: any) => entry.status?.toLowerCase() === 'pending').length);
            } else {
              setPendingLeaveCount(0);
            }
            delete (window as any)[callbackName];
            resolve(data);
          };
          const script = document.createElement('script');
          script.src = `${LEAVE_APP_SCRIPT_URL}?sheetId=${sheetId}&callback=${callbackName}`;
          script.onerror = () => {
            delete (window as any)[callbackName];
            reject(new Error('JSONP request failed'));
          };
          document.head.appendChild(script);
        });
      } catch (error) {
        setPendingLeaveCount(0);
      } finally {
        setPendingLoading(false);
      }
    };
    fetchPendingLeave();
  }, []);

  // Fetch pending document requests
  useEffect(() => {
    const fetchPendingDocs = async () => {
      const spreadsheetId = localStorage.getItem('spreadsheetId') || '';
      if (!spreadsheetId) {
        setPendingDocCount(0);
        setPendingLoading(false);
        return;
      }
      try {
        const formData = new URLSearchParams();
        formData.append('action', 'getAllHistory');
        formData.append('spreadsheetId', spreadsheetId);
        const response = await fetch(DOC_APP_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: formData,
        });
        if (response.ok) {
          const result = await response.json();
          if (result.data && Array.isArray(result.data)) {
            setPendingDocCount(result.data.filter((req: any) => req.status?.toLowerCase() === 'pending').length);
          } else {
            setPendingDocCount(0);
          }
        } else {
          setPendingDocCount(0);
        }
      } catch (error) {
        setPendingDocCount(0);
      } finally {
        setPendingLoading(false);
      }
    };
    fetchPendingDocs();
  }, []);

  // Fetch current month's timesheet and calculate hours
  useEffect(() => {
    async function fetchMonthHours() {
      const userEmail = localStorage.getItem('userEmail');
      const empId = localStorage.getItem('userId');
      const spreadsheetId = localStorage.getItem('spreadsheetId') || '1WGvnJUF5n1ZoKHk5y8DzztYSuKhuNJBb-mquGwiRZ1w';
      if (!userEmail || !empId) {
        setMonthLoading(false);
        setMonthHours(0);
        return;
      }
      try {
        const requestData = {
          action: 'getLogs',
          email: userEmail,
          empId: empId,
          spreadsheetId
        };
        const response = await fetch(TIMESHEET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(requestData)
        });
        if (!response.ok) {
          setMonthLoading(false);
          setMonthHours(0);
          return;
        }
        const result = await response.json();
        // Get allDates and logs
        const allDates = Array.isArray(result.allDates) ? result.allDates : [];
        const logs = result.logs || {};
        // Get current month
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        // Filter dates for current month
        const monthDates = allDates.filter(dateStr => {
          const [yyyy, mm] = dateStr.split('-');
          return Number(mm) === currentMonth && Number(yyyy) === currentYear;
        });
        // Calculate total hours for current month
        let totalSeconds = 0;
        monthDates.forEach(date => {
          const entries = logs[date] || [];
          entries.forEach(entry => {
            if (entry.end && entry.start) {
              const start = new Date(`2000-01-01 ${entry.start}`).getTime();
              const end = new Date(`2000-01-01 ${entry.end}`).getTime();
              totalSeconds += (end - start) / 1000;
            } else if (entry.start && (!entry.end || entry.end === '')) {
              // Running entry: calculate up to now
              const start = new Date(`2000-01-01 ${entry.start}`).getTime();
              const nowTime = new Date(`2000-01-01 ${now.toTimeString().slice(0, 8)}`).getTime();
              totalSeconds += (nowTime - start) / 1000;
            }
          });
        });
        setMonthHours(totalSeconds / 3600);
      } catch (err) {
        setMonthHours(0);
      } finally {
        setMonthLoading(false);
      }
    }
    fetchMonthHours();
  }, []);

  // Fetch last week's timesheet and calculate hours
  useEffect(() => {
    async function fetchWeekHours() {
      const userEmail = localStorage.getItem('userEmail');
      const empId = localStorage.getItem('userId');
      const spreadsheetId = localStorage.getItem('spreadsheetId') || '1WGvnJUF5n1ZoKHk5y8DzztYSuKhuNJBb-mquGwiRZ1w';
      if (!userEmail || !empId) {
        setWeekLoading(false);
        setWeekHours(0);
        return;
      }
      try {
        const requestData = {
          action: 'getLogs',
          email: userEmail,
          empId: empId,
          spreadsheetId
        };
        const response = await fetch(TIMESHEET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(requestData)
        });
        if (!response.ok) {
          setWeekLoading(false);
          setWeekHours(0);
          return;
        }
        const result = await response.json();
        // Get availableDates (last 7 days) and logs
        const dates = Array.isArray(result.availableDates) ? result.availableDates : [];
        const logs = result.logs || {};
        // Calculate total hours for last 7 days
        let totalSeconds = 0;
        dates.forEach(date => {
          const entries = logs[date] || [];
          entries.forEach(entry => {
            if (entry.end && entry.start) {
              const start = new Date(`2000-01-01 ${entry.start}`).getTime();
              const end = new Date(`2000-01-01 ${entry.end}`).getTime();
              totalSeconds += (end - start) / 1000;
            } else if (entry.start && (!entry.end || entry.end === '')) {
              // Running entry: calculate up to now
              const start = new Date(`2000-01-01 ${entry.start}`).getTime();
              const now = new Date();
              const currentTime = new Date(`2000-01-01 ${now.toTimeString().slice(0, 8)}`).getTime();
              totalSeconds += (currentTime - start) / 1000;
            }
          });
        });
        setWeekHours(totalSeconds / 3600);
      } catch (err) {
        setWeekHours(0);
      } finally {
        setWeekLoading(false);
      }
    }
    fetchWeekHours();
  }, []);
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
  useEffect(() => {
  const empId = localStorage.getItem('userId');
  const role = localStorage.getItem('role') || 'Employees';
  if (!empId) return;

  fetch(`${scriptUrl}?EMP_ID=${empId}&role=${role}`)
    .then(res => res.json())
    .then(data => {
      if (data.IMAGE_URL) {
        fetch(`${scriptUrl}?fileId=${data.IMAGE_URL}`)
          .then(res => res.text())
          .then(dataUri => setProfileImage(dataUri))
          .catch(() => setProfileImage(null));
      } else {
        setProfileImage(null);
      }
    })
    .catch(() => setProfileImage(null));
}, []);

  const [newsData, setNewsData] = useState<NewsItem[]>([]);
useEffect(() => {
  fetch(
    'https://script.google.com/macros/s/AKfycbxdBeibvOx5xqJ4v6hCITckMdMGWefPCpta6sHL0lcySJMnlI0ycTX2vD8_5-fKST47/exec?action=getNews'
  )
    .then((res) => res.json())
    .then(async (data) => {
      // For each news item, fetch the base64 image
      const updated = await Promise.all(
        data.map(async (item) => {
          if (item.imageId) {
            const res = await fetch(
              `https://script.google.com/macros/s/AKfycbxdBeibvOx5xqJ4v6hCITckMdMGWefPCpta6sHL0lcySJMnlI0ycTX2vD8_5-fKST47/exec?action=getImage&id=${item.imageId}`
            );
            const base64 = await res.text();
            return {
              ...item,
              image: `data:image/png;base64,${base64}`, // 👈 Embed image as base64
              fullText: `${item.description}\n\nClick to read more...`,
            };
          } else {
            return {
              ...item,
              image: '', // No image available
              fullText: `${item.description}\n\nClick to read more...`,
            };
          }
        })
      );

      setNewsData(updated);
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
    console.log('Logout initiated...');
    console.log('localStorage before clear:', { ...localStorage });
    
    // Clear localStorage
    localStorage.clear();
    console.log('localStorage after clear:', { ...localStorage });
    
    // Call AuthContext logout
    logout();
    
    // Navigate to login page
    navigate('/');
  };

  // State for completed courses
  const [completedCoursesCount, setCompletedCoursesCount] = useState<number | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const TRAINING_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAlAIg39DiQgbYnlivOr9zIowb_2Y3iW9o1kDFBItgMYPxqewxeLX1b7hbrXs61MeWAA/exec';

  useEffect(() => {
    const sheetId = localStorage.getItem('spreadsheetId');
    if (!sheetId) {
      setCompletedCoursesCount(0);
      setCoursesLoading(false);
      return;
    }
    fetch(`${TRAINING_SCRIPT_URL}?sheetId=${sheetId}`)
      .then(res => res.json())
      .then(data => {
        setCompletedCoursesCount(Array.isArray(data.completed) ? data.completed.length : 0);
      })
      .catch(() => setCompletedCoursesCount(0))
      .finally(() => setCoursesLoading(false));
  }, []);

  const statCards = [
    coursesLoading || completedCoursesCount === null
      ? {
          title: (
            <div className="flex items-center justify-center">
              <span className="animate-pulse w-16 h-8 bg-gray-200 rounded" />
            </div>
          ),
          subtitle: 'Completed Courses',
          color: 'text-blue-600',
        }
      : {
          title: `${completedCoursesCount} courses`,
          subtitle: 'Completed Courses',
          color: 'text-blue-600',
        },
    monthLoading || monthHours === null
      ? {
          title: (
            <div className="flex items-center justify-center">
              <span className="animate-pulse w-24 h-8 bg-gray-200 rounded" />
            </div>
          ),
          subtitle: 'Hours This Month',
          color: 'text-green-500',
        }
      : {
          title: `${monthHours.toFixed(1)} hrs`,
          subtitle: 'Hours This Month',
          color: 'text-green-500',
          progress: Math.min(((monthHours as number) / monthTarget) * 100, 100),
        },
    pendingLoading || pendingLeaveCount === null || pendingDocCount === null
      ? {
          title: (
            <div className="flex items-center justify-center">
              <span className="animate-pulse w-8 h-8 bg-gray-200 rounded-full" />
            </div>
          ),
          subtitle: 'Pending Requests',
          color: 'text-red-600',
        }
      : {
          title: `${pendingLeaveCount} Leave, ${pendingDocCount} Document`,
          subtitle: 'Pending Requests',
          color: 'text-red-600',
        },
  ];
  const sidebarItems: SidebarItem[] = [
    { title: 'Timesheet', icon: Clock, path: '/timesheet' },
    { title: 'Leave Request', icon: CalendarIcon, path: '/leave' },
    { title: 'Company Calendar', icon: CalendarIcon, path: '/calendar' },
    { title: 'Document Request', icon: Lock, path: '/requests' },
    { title: 'Training & Courses', icon: Book, path: '/training' },
    { title: 'Company Achievements', icon: BarChart2, path: '/company' },
    { title: 'Help & Support', icon: HelpCircle, path: '/help' }
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
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [holidayDates, setHolidayDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const holidayCache = {};
  const fetchHolidaysForMonth = async (month, year) => {
  const cacheKey = `${year}-${String(month).padStart(2, '0')}`;
  if (holidayCache[cacheKey]) {
    setUpcomingHolidays(holidayCache[cacheKey].upcomingHolidays);
    setHolidayDates(holidayCache[cacheKey].holidayDates);
    return;
  }
  setLoading(true);
  try {
    const dateString = `${year}-${String(month).padStart(2, '0')}`;
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbxtN6eHCm3RiWjOmCPOavRNrBpzV0Bwc2wT8NAqE25NCROCt1WMMQTI7mSlT3iiGgdb/exec?action=getHolidays&date=${dateString}`
    );
    const data = await response.json();
    // Map backend data to expected frontend format
    const mapped = data.map(h => ({
      date: h.Date || h.date, // 'yyyy-mm-dd'
      holiday: h.Title || h.title, // holiday name
      type: h.type || '', // optional
    }));
    setUpcomingHolidays(mapped);
    setHolidayDates(mapped.map(h => h.date));
    holidayCache[cacheKey] = {
      upcomingHolidays: mapped,
      holidayDates: mapped.map(h => h.date),
    };
  } catch (error) {
    console.error("Failed to fetch holidays", error);
  } finally {
    setLoading(false);
  }
};
// Fetch current month on mount
useEffect(() => {
  const today = new Date();
  fetchHolidaysForMonth(today.getMonth() + 1, today.getFullYear());
}, []);
const scriptUrl = 'https://script.google.com/macros/s/AKfycbz0b9c2rTYUGRSyVbbsXVcnenIFOIbsuQY2JrvP_Ar65QW1fIJcv61Y39aXA-VOing0dg/exec';
const [profileImage, setProfileImage] = useState<string | null>(null);
const [profileLoading, setProfileLoading] = useState(true);
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
        handleLogout();
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
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-36 h-36 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xl font-bold border-4 border-white shadow-md">
                    {userName[0] || 'U'}
                  </div>
                )}

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
                    {weekLoading || weekHours === null ? (
                      <div className="animate-pulse w-32 h-8 bg-gray-200 rounded mb-2" />
                    ) : (
                      <div className="text-2xl font-bold text-green-800 mb-2">
                        {weekHours.toFixed(1)} / {weekTarget} hours
                      </div>
                    )}
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      {weekLoading || weekHours === null ? (
                        <div className="bg-gray-300 h-3 rounded-full animate-pulse" style={{ width: '100%' }} />
                      ) : (
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((weekHours / weekTarget) * 100, 100)}%` }}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => {
                  setHoveredCardIndex(index);
                  if (typeof stat.subtitle === 'string' && stat.subtitle.includes('Achievements')) triggerCelebration();
                }}
                onMouseLeave={() => setHoveredCardIndex(null)}
              >
                {typeof stat.subtitle === 'string' && stat.subtitle.includes('Achievements') && (
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
    <div className="h-[220px] w-[220px] relative">
      <Pie data={leavePieData} options={{ ...leavePieOptions, plugins: { legend: { display: false } } }} />

      {/* 👇 Custom Legend aligned in a single row */}
      <div className="mt-4 flex justify-center gap-4 text-sm absolute bottom-[-36px] left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-blue-500 rounded-sm"></span>
          <span className="text-gray-700">Casual</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-red-500 rounded-sm"></span>
          <span className="text-gray-700">Sick</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-500 rounded-sm"></span>
          <span className="text-gray-700">Earned</span>
        </div>
      </div>
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
                    <div className="react-calendar-wrapper rounded-xl overflow-hidden relative min-h-[320px]">
                      {loading && (
                        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
                          <span className="text-sm text-gray-600 font-medium">Loading...</span>
                        </div>
                      )}
                      <Calendar
                        onActiveStartDateChange={({ activeStartDate }) => {
                          const month = activeStartDate.getMonth() + 1;
                          const year = activeStartDate.getFullYear();
                          fetchHolidaysForMonth(month, year);
                        }}
                        tileClassName={({ date }) => {
                          const current = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                          const today = new Date();
                          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                          const isHoliday = holidayDates.includes(current);
                          const isToday = current === todayStr;

                          if (isToday && isHoliday) return 'bg-purple-700 text-white font-semibold rounded-md';
                          if (isHoliday) return 'bg-green-700 text-white font-semibold rounded-md';
                          if (isToday) return 'bg-blue-500 text-white font-semibold rounded-md';

                          return '';
                        }}
                        className="w-full border-none"
                      />
                    </div>
                  </div>
                  {/* Upcoming holidays list below the calendar */}
                  <ul className="mt-4 text-sm text-gray-700 space-y-2">
                    {[...upcomingHolidays]
                      .sort((a, b) => {
                        // Parse date strings in format dd/mm/yyyy
                        const parse = (d) => {
                          if (!d) return 0;
                          const [dd, mm, yyyy] = d.split('/');
                          return new Date(`${yyyy}-${mm}-${dd}`).getTime();
                        };
                        return parse(a.date) - parse(b.date);
                      })
                      .map((h, i) => (
                        <li key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 shadow-sm">
                          <div>
                            <span className="font-semibold text-green-800">{h.holiday}</span>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-2">{h.type}</span>
                          </div>
                          <span className="text-green-700 font-semibold text-sm">
                            {h.date}
                          </span>
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

      {selectedNews.image ? (
        <>
          <a
            href={selectedNews.image}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-4 text-blue-600 underline text-sm"
          >
            View Image in New Tab
          </a>
          <img
            src={selectedNews.image}

            alt="News"
            className="rounded-xl w-full h-64 object-cover mb-6 shadow"
            onError={(e) => {
              // Hide broken images
              e.currentTarget.style.display = 'none';
            }}
          />
        </>
      ) : (
        <p className="text-gray-500 italic mb-4">No image preview available.</p>
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