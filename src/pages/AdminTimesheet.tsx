import React, { useEffect, useState, useRef } from 'react';
import {
  Clock,
  Folder,
  FileText,
  Bell,
  User,
  Home,
  UserCircle,
  Printer,
  Share2,
  CircleDollarSign,
  ToggleRight,
  Download,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const menuItems = [
  { name: 'Timesheet', icon: <Clock size={20} />, path: '/admin/timesheet' },
  { name: 'Projects', icon: <Folder size={20} />, path: '/admin/projects' },
];

const AdminTimesheet: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [showCalendar, setShowCalendar] = useState(false);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !(profileRef.current as any).contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSummaryClick = () => {};
  const handleDetailedClick = () => {};
  const handleWeeklyClick = () => {};
  const handleSharedClick = () => {};

  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Hours Logged',
        data: [0, 0, 0, 0.19, 0, 0, 0],
        backgroundColor: '#8B5C51',
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: 0.2,
        ticks: {
          stepSize: 0.02,
          callback: (value: any) => `${value.toFixed(2)}h`,
        },
      },
    },
  };

  const donutData = {
    labels: ['sedrtfghjkl'],
    datasets: [
      {
        data: [0.19],
        backgroundColor: ['#8B5C51'],
        borderWidth: 0,
      },
    ],
  };

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
                location.pathname === item.path ? 'bg-green-50 border-l-4 border-green-600' : ''
              )}
            >
              <div className="text-green-700">{item.icon}</div>
              {!collapsed && <span className="ml-3 text-gray-700">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Area */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">
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
                onClick={() => setIsProfileOpen((prev) => !prev)}
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

        {/* Tab Buttons and Date Picker Row */}
<div className="bg-white p-3 rounded-lg shadow max-w-6xl mx-auto mt-6 flex justify-between items-center">
  <div className="flex items-center gap-3">
    <select className="border text-sm px-3 py-1.5 rounded">
      <option>Team Report</option>
    </select>
    <div className="flex gap-2">
      <button
        onClick={handleSummaryClick}
        className="px-4 py-1.5 text-sm rounded border border-green-600 bg-green-100 text-green-700"
      >
        Summary
      </button>
      <button
        onClick={handleDetailedClick}
        className="px-4 py-1.5 text-sm rounded border text-gray-700 hover:bg-gray-100"
      >
        Detailed
      </button>
      <button
        onClick={handleWeeklyClick}
        className="px-4 py-1.5 text-sm rounded border text-gray-700 hover:bg-gray-100"
      >
        Weekly
      </button>
      <button
        onClick={handleSharedClick}
        className="px-4 py-1.5 text-sm rounded border text-gray-700 hover:bg-gray-100"
      >
        Shared
      </button>
    </div>
  </div>

  {/* Custom Date Picker Dropdown */}
  <div className="relative">
    <Button
      variant="outline"
      className="text-sm px-3 py-1.5 flex items-center gap-2"
      onClick={() => setShowCalendar(prev => !prev)}
    >
      <span>&lt;</span>
      <span>This week</span>
      <span>&gt;</span>
    </Button>
    {showCalendar && (
      <div className="absolute right-0 mt-2 w-[600px] bg-white border rounded-lg shadow-lg p-4 z-50">
        <div className="flex">
          {/* Predefined Options */}
          <div className="w-48 pr-4 border-r">
            <ul className="space-y-1 text-sm text-gray-700 divide-y divide-gray-200">
              <li className="py-1 cursor-pointer hover:text-green-700">Today</li>
              <li className="py-1 cursor-pointer hover:text-green-700">Yesterday</li>
              <li className="py-1 cursor-pointer hover:text-green-700">This week</li>
              <li className="py-1 cursor-pointer hover:text-green-700">Last week</li>
              <li className="py-1 cursor-pointer hover:text-green-700">Past two weeks</li>
              <li className="py-1 cursor-pointer hover:text-green-700">This month</li>
              <li className="py-1 cursor-pointer hover:text-green-700">Last month</li>
              <li className="py-1 cursor-pointer hover:text-green-700">This year</li>
              <li className="py-1 cursor-pointer hover:text-green-700">Last year</li>
            </ul>
          </div>
          {/* Dual Calendar Display */}
          <div className="flex gap-6 pl-4">
            <div>
              <p className="text-center font-semibold text-gray-800 mb-2">July 2025</p>
              <div className="grid grid-cols-7 gap-1 text-xs text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <span key={`jul-${day}`} className="font-medium text-gray-600">{day}</span>
                ))}
                {Array.from({ length: 31 }).map((_, i) => (
                  <span key={`jul-day-${i}`} className="py-1 px-1 rounded hover:bg-green-100 cursor-pointer">{i + 1}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-center font-semibold text-gray-800 mb-2">August 2025</p>
              <div className="grid grid-cols-7 gap-1 text-xs text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <span key={`aug-${day}`} className="font-medium text-gray-600">{day}</span>
                ))}
                {Array.from({ length: 31 }).map((_, i) => (
                  <span key={`aug-day-${i}`} className="py-1 px-1 rounded hover:bg-green-100 cursor-pointer">{i + 1}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
</div>

{/* Filter Row */}
<div className="bg-white p-3 rounded-lg shadow mt-3 max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-2">
  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-600 font-medium">FILTER</span>
    <select className="border rounded px-3 py-1.5 text-sm">
      <option>Team</option>
    </select>
    <select className="border rounded px-3 py-1.5 text-sm">
      <option>Client</option>
    </select>
    <select className="border rounded px-3 py-1.5 text-sm">
      <option>Project</option>
    </select>
  </div>
  <div className="flex items-center gap-2">
    <Button className="bg-sky-500 text-white text-sm px-4 py-1.5">APPLY FILTER</Button>
    <Button variant="outline" className="text-sm px-4 py-1.5">CLEAR FILTERS</Button>
  </div>
</div>
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
          {/* Summary Row */}
          <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <div className="text-sm md:text-base space-x-6 font-semibold text-gray-700">
              <span>Total: <span className="text-green-700">00:11:26</span></span>
              <span>Billable: <span className="text-green-700">00:11:26</span></span>
              <span>Amount: <span className="text-green-700">0,00 USD</span></span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <select className="border text-sm px-2 py-1 rounded">
                <option>Project</option>
              </select>
              <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon"><Printer className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon"><ToggleRight className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon"><CircleDollarSign className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Bar Chart */}
          <Card className="w-full">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Summary</h3>
              <Bar data={barData} options={barOptions} />
            </CardContent>
          </Card>

          {/* Donut Chart and Table */}
          <div className="bg-white rounded-lg shadow p-6 flex gap-6">
            <div className="w-2/3">
              {/* Top Bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4">
                  <select className="border px-2 py-1 rounded text-sm">
                    <option>Group by: Project</option>
                  </select>
                  <select className="border px-2 py-1 rounded text-sm">
                    <option>Description</option>
                  </select>
                </div>
                <label className="inline-flex items-center text-sm gap-2">
                  <input type="checkbox" className="form-checkbox rounded" />
                  Show estimate
                </label>
              </div>

              {/* Table */}
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2">Title</th>
                    <th className="text-left py-2">Duration</th>
                    <th className="text-left py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2">sedrtfghjkl</td>
                    <td className="py-2">00:11:26</td>
                    <td className="py-2">0,00 USD</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Donut Chart */}
            <div className="w-1/3 flex items-center justify-center relative">
              <Doughnut
                data={donutData}
                options={{
                  cutout: '70%',
                  plugins: { legend: { display: false } },
                }}
              />
              <div className="absolute text-sm font-bold text-center">00:11:26</div>
            </div>
          </div>
        </div>
         
      </main>
    </div>
  );
};

export default AdminTimesheet;
