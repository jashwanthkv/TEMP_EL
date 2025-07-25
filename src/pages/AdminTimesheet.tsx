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
import AdminProject from './AdminProject';

const menuItems = [
  { name: 'Timesheet', icon: <Clock size={20} />, path: '/admin/timesheet' },
  { name: 'Projects', icon: <Folder size={20} />, path: '/admin/project' },
];

const AdminTimesheet: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [highlightedDays, setHighlightedDays] = useState<number[]>([]);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [searchTeam, setSearchTeam] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [searchProject, setSearchProject] = useState('');
  const mockEmployees = ['Alice', 'Bob', 'Charlie', 'David'];
  const mockClients = ['Client A', 'Client B', 'Client C'];
  const mockProjects = ['Project X', 'Project Y', 'Project Z'];
  const [activeView, setActiveView] = useState('Timesheet');




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
  const handlePrevWeek = () => {
    // Handle going to previous week
  };

  const handleNextWeek = () => {
    // Handle going to next week
  };

  const handlePredefinedOption = (option: string) => {
    setSelectedOption(option);
    // Example: handle highlighting days based on selection
    if (option === 'Today') setHighlightedDays([25]); // Mock today as 25
    else if (option === 'Yesterday') setHighlightedDays([24]);
    else setHighlightedDays([]);
  };
  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Hours Logged',
        data: [0, 0, 0, 0.19, 0, 0, 0],
        backgroundColor: '#1fd446ff',
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
        backgroundColor: ['#13b13bff'],
        borderWidth: 0,
      },
    ],
  };
  const renderFilterDropdown = (
  label: string,
  isOpen: boolean,
  toggleOpen: React.Dispatch<React.SetStateAction<boolean>>,
  items: string[],
  searchValue: string,
  setSearchValue: React.Dispatch<React.SetStateAction<string>>
) => (
  <div className="relative">
    <Button
      variant="outline"
      className="text-sm px-3 py-1.5"
      onClick={() => toggleOpen((prev) => !prev)}
    >
      {label}
    </Button>
    {isOpen && (
      <div className="absolute mt-2 w-48 bg-white border rounded shadow z-50">
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full px-2 py-1 text-sm border-b"
        />
        <div className="px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer font-medium">Select All</div>
        {items
          .filter((item) => item.toLowerCase().includes(searchValue.toLowerCase()))
          .map((item) => (
            <div key={item} className="px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer">
              {item}
            </div>
          ))}
      </div>
    )}
  </div>
);

  return (
  <div className="flex flex-col h-screen">
    {/* Header (static, full-width) */}
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center w-full z-50">
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
    {/* Content wrapper: sidebar + main */}
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div
        className={clsx(
          'bg-white border-r shadow-sm transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-52'
        )}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
      > 
        <nav className="flex flex-col mt-4">
  {menuItems.map((item) => (
    <button
      key={item.name}
      onClick={() => setActiveView(item.name)}
      className={clsx(
        'flex items-center px-4 py-3 w-full text-left hover:bg-green-100 transition',
        activeView === item.name ? 'bg-green-50 border-l-4 border-green-600' : ''
      )}
    >
      <div className="text-green-700">{item.icon}</div>
      {!collapsed && <span className="ml-3 text-gray-700">{item.name}</span>}
    </button>
  ))}
</nav>

      </div>
     {/* Main Area */}
<main className="flex-1 bg-gray-50 overflow-y-auto">
  {activeView === 'Timesheet' && (
    <>
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
            className="text-sm px-3 py-1.5 flex items-center gap-2 border-l border-r"
            onClick={() => setShowCalendar(prev => !prev)}
          >
            <span onClick={handlePrevWeek} className="cursor-pointer">&lt;</span>
            <span>This week</span>
            <span onClick={handleNextWeek} className="cursor-pointer">&gt;</span>
          </Button>
          {showCalendar && (
            <div className="absolute right-0 mt-2 w-[620px] bg-white border rounded-lg shadow-lg p-4 z-50">
              <div className="flex">
                {/* Predefined Options */}
                <div className="w-48 pr-4 border-r">
                  <ul className="space-y-1 text-sm text-gray-700 divide-y divide-gray-200">
                    {["Today", "Yesterday", "This week", "Last week", "Past two weeks", "This month", "Last month", "This year", "Last year"].map(option => (
                      <li
                        key={option}
                        onClick={() => handlePredefinedOption(option)}
                        className={`py-1 px-2 rounded cursor-pointer ${selectedOption === option ? 'bg-green-100 text-green-800 font-medium' : 'hover:bg-green-50'}`}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Dual Calendar Display */}
                <div className="flex gap-6 pl-4">
                  {["July 2025", "August 2025"].map((month, index) => (
                    <div key={month}>
                      <p className="text-center font-semibold text-gray-800 mb-2">{month}</p>
                      <div className="grid grid-cols-7 gap-1 text-xs text-center">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                          <span key={`${month}-${day}`} className="font-medium text-gray-600">{day}</span>
                        ))}
                        {Array.from({ length: 31 }).map((_, i) => (
                          <span
                            key={`${month}-day-${i}`}
                            className={`py-1 px-1 rounded cursor-pointer ${highlightedDays.includes(i + 1) ? 'bg-green-200 text-white' : 'hover:bg-green-100'}`}
                          >
                            {i + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Filter Row */}
      <div className="bg-white p-3 rounded-lg shadow mt-3 max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-2 relative z-10">
        <div className="flex items-center gap-3 relative">
          <span className="text-sm text-gray-600 font-medium">FILTER</span>
          {renderFilterDropdown('Team', teamDropdownOpen, setTeamDropdownOpen, mockEmployees, searchTeam, setSearchTeam)}
          {renderFilterDropdown('Client', clientDropdownOpen, setClientDropdownOpen, mockClients, searchClient, setSearchClient)}
          {renderFilterDropdown('Project', projectDropdownOpen, setProjectDropdownOpen, mockProjects, searchProject, setSearchProject)}
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-sky-500 text-white text-sm px-4 py-1.5">APPLY FILTER</Button>
          <Button variant="outline" className="text-sm px-4 py-1.5">CLEAR FILTERS</Button>
        </div>
      </div>
      {/* Timesheet Summary and Charts */}
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
          <div className="text-sm md:text-base space-x-6 font-semibold text-gray-700">
            <span>Total: <span className="text-green-700">00:11:26</span></span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <select className="border text-sm px-2 py-1 rounded">
              <option>Project</option>
            </select>
            <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Printer className="h-4 w-4" /></Button>
          </div>
        </div>
        <Card className="w-full">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Summary</h3>
            <Bar data={barData} options={barOptions} />
          </CardContent>
        </Card>
        <div className="bg-white rounded-lg shadow p-6 flex gap-6">
          <div className="w-2/3">
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
          <div className="w-1/3 flex items-center justify-center relative">
            <Doughnut
              data={donutData}
              options={{ cutout: '70%', plugins: { legend: { display: false } } }}
            />
            <div className="absolute text-sm font-bold text-center">00:11:26</div>
          </div>
        </div>
      </div>
    </>
  )}
  {activeView === 'Projects' && (
    <div className="p-6">
      <AdminProject />
    </div>
  )}
</main>
    </div>
  </div>
);
};
export default AdminTimesheet;
