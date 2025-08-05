// Single-select dropdown for Client and Project filters
  const renderFilterDropdown = (
    label: string,
    isOpen: boolean,
    toggleOpen: React.Dispatch<React.SetStateAction<boolean>>,
    items: string[],
    selected: string,
    setSelected: React.Dispatch<React.SetStateAction<string>>,
    searchValue?: string,
    setSearchValue?: React.Dispatch<React.SetStateAction<string>>
  ) => (
    <div className="relative">
      <Button
        variant="outline"
        className="text-sm px-3 py-1.5"
        onClick={() => toggleOpen((prev) => !prev)}
      >
        {selected || label}
      </Button>
      {isOpen && (
        <div className="absolute mt-2 w-48 bg-white border rounded shadow z-50">
          {searchValue !== undefined && setSearchValue !== undefined && (
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full px-2 py-1 text-sm border-b"
            />
          )}
          {items
            .filter((item) =>
              searchValue ? item.toLowerCase().includes(searchValue.toLowerCase()) : true
            )
            .map((item) => (
              <div
                key={item}
                className={`px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 ${selected === item ? 'bg-green-50 font-medium' : ''}`}
                onClick={() => {
                  setSelected(item);
                  toggleOpen(false);
                }}
              >
                {item}
              </div>
            ))}
        </div>
      )}
    </div>
  );
import React, { useEffect, useState, useRef } from 'react';
import styles from './AdminTimesheet.module.css';
import RequireLogin from '@/components/ui/RequireLogin';
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
  FileDown,
  FileText as FileTextIcon,
} from 'lucide-react';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, ChartDataLabels);
import AdminProject from './AdminProject';

const menuItems = [
  { name: 'Timesheet', icon: <Clock size={20} />, path: '/admin/timesheet' },
  { name: 'Projects', icon: <Folder size={20} />, path: '/admin/project' },
];

const AdminTimesheet: React.FC = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  // CSV Download Handler
  const handleDownloadCSV = () => {
    if (!employeeTimesheet || !selectedEmployee) return;
    // Only include filtered columns/rows for the selected date range
    const { columns, rows } = filterTimesheetByDateRange(employeeTimesheet, dateRange);
    let csv = '';
    const empObj = employees.find(e => e.id === selectedEmployee);
    if (empObj) {
      csv += `Employee,${empObj.name}\n`;
    } else {
      csv += `Employee,${selectedEmployee}\n`;
    }
    if (columns.length > 0) {
      // Header: Date, Time Worked, Entry 1, Entry 2, ...
      const maxEntries = Math.max(0, ...rows.map(r => r.length));
      csv += ['Date', 'Time Worked', ...Array.from({length: maxEntries}, (_, i) => `Entry ${i+1}`)].join(',') + '\n';
      columns.forEach((col, i) => {
        // Only use date part before 'T'
        const datePart = col.split('T')[0];
        // Calculate total hours for this date (sum all projects)
        let totalHours = 0;
        rows.forEach(row => {
          const cell = row[i];
          if (cell) {
            const entries = cell.includes('||') ? cell.split('||') : [cell];
            entries.forEach(entry => {
              const parts = entry.split('|').map(s => s.trim());
              if (parts.length >= 4) {
                const start = parts[2];
                const end = parts[3];
                const parseTime = (t) => {
                  const [h, m, s] = t.split(':').map(Number);
                  return h * 60 + m + (s ? s / 60 : 0);
                };
                const startMins = parseTime(start);
                const endMins = parseTime(end);
                let hours = (endMins - startMins) / 60;
                if (hours < 0) hours += 24;
                totalHours += hours;
              }
            });
          }
        });
        // Format as 'Xh Ym'
        const h = Math.floor(totalHours);
        const m = Math.round((totalHours - h) * 60);
        let timeWorked = '';
        if (h > 0) timeWorked += `${h}h`;
        if (m > 0) timeWorked += (h > 0 ? ' ' : '') + `${m}m`;
        // For each date, output all entries for that date (row-wise)
        const rowVals = rows.map(row => row[i] || '').join(',');
        csv += `${datePart},${timeWorked},${rowVals}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet_${selectedEmployee}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // PDF Download Handler
  const handleDownloadPDF = async () => {
    if (!selectedEmployee) return;
    const empObj = employees.find(e => e.id === selectedEmployee);
    // Find the summary container
    const summaryContainer = document.querySelector('.timesheet-summary-capture') as HTMLElement | null;
    if (!summaryContainer) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    // Title and employee info
    doc.setFontSize(16);
    doc.text(`Timesheet Report`, 40, 40);
    doc.setFontSize(12);
    if (empObj) {
      doc.text(`Employee: ${empObj.name}`, 40, 65);
    } else {
      doc.text(`Employee: ${selectedEmployee}`, 40, 65);
    }
    if (dateRange) {
      const start = dateRange.start.toLocaleDateString();
      const end = dateRange.end.toLocaleDateString();
      doc.text(`Date Range: ${start} - ${end}`, 40, 105);
    }
    // Capture the summary section as an image
    const imgData = await html2canvas(summaryContainer, {backgroundColor: null, scale: 2}).then(canvas => canvas.toDataURL('image/png', 1.0));
    // Calculate image width to fit A4 (max 520pt wide, keep aspect ratio)
    const pageWidth = 520;
    const img = new window.Image();
    img.src = imgData;
    await new Promise(res => { img.onload = res; });
    const imgWidth = Math.min(pageWidth, img.width / 2);
    const imgHeight = img.height * (imgWidth / img.width);
    doc.addImage(imgData, 'PNG', 40, 120, imgWidth, imgHeight);
    doc.save(`timesheet_${selectedEmployee}.pdf`);
  };
  // State for selected calendar day (for single day view)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  // Handler for clicking a day in the calendar
  const handleDayClick = (dayNum: number) => {
    setSelectedCalendarDay(dayNum);
    // Set dateRange to the selected day only
    const selectedDate = new Date(calendarYear, calendarMonth, dayNum);
    selectedDate.setHours(0, 0, 0, 0);
    setDateRange({ start: selectedDate, end: selectedDate });
    setHighlightedDays([dayNum]);
  };
  // State for dynamic calendar month/year
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  // Calendar calculations for dynamic calendar
  const monthDate = new Date(calendarYear, calendarMonth, 1);
  const calendarMonthLabel = monthDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const emptyDays = Array.from({ length: startDay });
  const daysArray = Array.from({ length: daysInMonth });

  // Handlers for prev/next month
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };
  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };
  // Date range state for filtering
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
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
  // Team filter: multi-select
  const [searchTeam, setSearchTeam] = useState<string[]>([]);
  const [searchClient, setSearchClient] = useState('');
  const [searchProject, setSearchProject] = useState('');
  // State for employees and timesheet
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employeeTimesheet, setEmployeeTimesheet] = useState<any>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingTimesheet, setLoadingTimesheet] = useState(false);
  const EMPLOYEE_API_URL =
    'https://script.google.com/macros/s/AKfycbxeKUf-9LFaMvH8tBa9jGuTMz5_h1Uk9N85cjtdNeyl1xLn16bDZqBZZPHonj-6Ba94_w/exec';
  // Dynamic clients and projects fetched from backend
  const [clients, setClients] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);

  // Fetch projects and clients from backend (Apps Script)
  useEffect(() => {
    const fetchProjectsAndClients = async () => {
      try {
        const url = 'https://script.google.com/macros/s/AKfycbwWy9JiCu0WPRQjDyEe5tG6LrdQSxIYkLPJS94bsOJsQwRovMz24oADW9SaY3EddjwT/exec?action=list';
        const res = await fetch(url);
        const data = await res.json();
        // Extract unique clients and projects
        const clientSet = new Set<string>();
        const projectSet = new Set<string>();
        if (Array.isArray(data)) {
          data.forEach((item) => {
            if (item.client) clientSet.add(item.client);
            if (item.name) projectSet.add(item.name);
          });
        }
        setClients(Array.from(clientSet));
        setProjects(Array.from(projectSet));
      } catch (err) {
        setClients([]);
        setProjects([]);
      }
    };
    fetchProjectsAndClients();
  }, []);
  const [activeView, setActiveView] = useState('Timesheet');




  // Set default date range to past 7 days on mount
  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 7);
    setDateRange({ start, end: today });
    setSelectedOption('This week');
    setHighlightedDays(Array.from({ length: 7 }, (_, i) => start.getDate() + (i+1)));
  }, []);

  // Profile dropdown close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !(profileRef.current as any).contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch employee list on mount
  useEffect(() => {
    setLoadingEmployees(true);
    fetch(`${EMPLOYEE_API_URL}?type=employeeList`)
      .then((res) => res.json())
      .then((data) => {
        setEmployees(data);
        setLoadingEmployees(false);
      })
      .catch(() => setLoadingEmployees(false));
  }, []);

  // Fetch timesheet when employee changes
  useEffect(() => {
    if (!selectedEmployee) {
      setEmployeeTimesheet(null);
      return;
    }
    setLoadingTimesheet(true);
    const empId = String(selectedEmployee).trim();
    const url = `${EMPLOYEE_API_URL}?type=timesheet&empId=${encodeURIComponent(empId)}`;
    // Debug log
    console.log('Fetching timesheet for empId:', empId, 'URL:', url);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setEmployeeTimesheet(data);
        setLoadingTimesheet(false);
      })
      .catch(() => setLoadingTimesheet(false));
  }, [selectedEmployee]);

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
    const today = new Date();
    let start: Date, end: Date;
    let highlight: number[] = [];
    switch (option) {
      case 'Today': {
        start = new Date(today);
        end = new Date(today);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);
        break;
      }
      case 'Yesterday': {
        const yest = new Date(today);
        yest.setDate(yest.getDate() - 1);
        yest.setHours(0,0,0,0);
        start = new Date(yest);
        end = new Date(yest);
        break;
      }
      case 'This week':
        // Current week: from this week's Monday to today
        const dayOfWeek = today.getDay();
        start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek);
        start.setHours(0,0,0,0);
        end = new Date(today);
        end.setHours(0,0,0,0);
        break;
      case 'Last week': {
        // Last full week: 7 days before this week
        // Find last week's Monday (or first day of week)
        const dayOfWeek = today.getDay();
        // Go to previous week's Sunday (end)
        end = new Date(today);
        end.setDate(today.getDate() - dayOfWeek - 1);
        end.setHours(0,0,0,0);
        // Go to previous week's Monday (start)
        start = new Date(end);
        start.setDate(end.getDate() - 6);
        start.setHours(0,0,0,0);
        break;
      }
      case 'Past two weeks':
        start = new Date(today);
        start.setDate(today.getDate() - 13); // 14 days including today
        end = new Date(today);
        break;
      case 'This month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
        break;
      case 'Last month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'This year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today);
        break;
      case 'Last year':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        start = new Date(today);
        end = new Date(today);
    }
    // Always include both start and end date in highlight (even if same)
    if (start.getMonth() === end.getMonth()) {
      const startDay = start.getDate();
      const endDay = end.getDate();
      if (startDay <= endDay) {
        highlight = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i);
      } else {
        // In case of reversed range (shouldn't happen, but just in case)
        highlight = [startDay];
      }
    } else {
      highlight = [];
    }
    setDateRange({ start, end });
    setHighlightedDays(highlight);
  };
  // Helper to filter columns/rows by dateRange
function filterTimesheetByDateRange(timesheet: any, range: { start: Date; end: Date } | null) {
  if (!timesheet || !range) return { columns: [], rows: [] };
  let columns: string[] = [];
  let rows: string[][] = [];
  if (timesheet.columns && timesheet.rows) {
    columns = timesheet.columns;
    rows = timesheet.rows;
  } else if (Array.isArray(timesheet) && timesheet.length > 0 && Array.isArray(timesheet[0])) {
    columns = timesheet[0];
    rows = timesheet.slice(1);
  }
  // Helper to get YYYY-MM-DD string
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
  const startStr = toDateStr(range.start);
  const endStr = toDateStr(range.end);
  const filteredColIdx: number[] = columns.map((col, idx) => {
    // Try to extract date part from col (handle possible time or other text)
    let colDateStr = '';
    try {
      const d = new Date(col);
      if (!isNaN(d.getTime())) {
        colDateStr = toDateStr(d);
      } else {
        // fallback: try to match YYYY-MM-DD in string
        const m = col.match(/\d{4}-\d{2}-\d{2}/);
        if (m) colDateStr = m[0];
      }
    } catch {
      //Ignore
    }
    return (colDateStr >= startStr && colDateStr <= endStr) ? idx : -1;
  }).filter(idx => idx !== -1);
  const filteredColumns = filteredColIdx.map(idx => columns[idx]);
  const filteredRows = rows.map(row => filteredColIdx.map(idx => row[idx]));
  return { columns: filteredColumns, rows: filteredRows };
}
  // Multi-select dropdown for Team filter
  const renderTeamMultiSelect = (
    label: string,
    isOpen: boolean,
    toggleOpen: React.Dispatch<React.SetStateAction<boolean>>,
    items: string[],
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    searchValue: string,
    setSearchValue: React.Dispatch<React.SetStateAction<string>>
  ) => (
    <div className="relative">
      <Button
        variant="outline"
        className="text-sm px-3 py-1.5"
        onClick={() => toggleOpen((prev) => !prev)}
      >
        {selected.length > 0 ? selected.join(', ') : label}
      </Button>
      {isOpen && (
        <div className="absolute mt-2 w-56 bg-white border rounded shadow z-50">
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full px-2 py-1 text-sm border-b"
          />
          <div
            className="px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer font-medium"
            onClick={() => setSelected(items)}
          >Select All</div>
          {items
            .filter((item) => item.toLowerCase().includes(searchValue.toLowerCase()))
            .map((item) => (
              <div
                key={item}
                className={`px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 flex items-center gap-2 ${selected.includes(item) ? 'bg-green-50 font-medium' : ''}`}
                onClick={() => {
                  if (selected.includes(item)) {
                    setSelected(selected.filter((s) => s !== item));
                  } else {
                    setSelected([...selected, item]);
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(item)}
                  readOnly
                  className="mr-2"
                />
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
          <p className="text-base font-semibold text-gray-600">Employee Timesheet</p>
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <span className="text-lg font-bold text-green-700">EMPWR</span>
        <button
          onClick={() => navigate('/admin/notifications')}
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
                  navigate('/admin/profile');
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
<main className={"flex-1 bg-gray-50 overflow-y-auto " + (showCalendar ? 'pb-64' : '')}>
  {activeView === 'Timesheet' && (
    <>
      {/* Tab Buttons and Date Picker Row */}
      <div className="bg-white p-3 rounded-lg shadow max-w-6xl mx-auto mt-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Dynamic Team Report Dropdown */}
          <select
            className="border text-sm px-3 py-1.5 rounded min-w-[180px]"
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
            disabled={loadingEmployees}
          >
            <option value="">{loadingEmployees ? 'Loading employees...' : 'Select Employee'}</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        {/* Custom Date Picker Dropdown */}
        <div className="relative flex items-center gap-2">
          {/* Download as CSV */}
          <button
            title="Download as CSV"
            onClick={handleDownloadCSV}
            className="p-2 rounded hover:bg-green-100 text-green-700 border border-green-200"
          >
            <FileDown size={18} />
          </button>
          {/* Download as PDF */}
          <button
            title="Download as PDF"
            onClick={handleDownloadPDF}
            className="p-2 rounded hover:bg-green-100 text-green-700 border border-green-200"
          >
            <FileTextIcon size={18} />
          </button>
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
            <div className="fixed left-1/2 top-[110px] -translate-x-1/2 w-[620px] bg-white border rounded-lg shadow-lg p-4 z-50" style={{maxWidth:'98vw'}}>
              <button
                onClick={() => setShowCalendar(false)}
                className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 text-gray-500"
                title="Close"
                aria-label="Close calendar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
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
                {/* Single Month Calendar Display */}
                <div className="flex-1 flex flex-col justify-center items-center">
                  {/* Dynamic Calendar Month View with arrows, full width */}
                  <div className="w-full max-w-xl mx-auto">
                    <div className="flex items-center justify-between mb-4 px-4">
                      <button onClick={handlePrevMonth} className="px-3 py-1 text-lg font-bold text-gray-600 hover:bg-gray-100 rounded">&#8592;</button>
                      <p className="text-center font-semibold text-gray-800 text-lg">{calendarMonthLabel}</p>
                      <button onClick={handleNextMonth} className="px-3 py-1 text-lg font-bold text-gray-600 hover:bg-gray-100 rounded">&#8594;</button>
                    </div>
                    <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-sm text-center w-full px-2">
                      {weekDays.map(day => (
                        <span key={day} className="font-medium text-gray-600 py-1">{day}</span>
                      ))}
                      {emptyDays.map((_, i) => <span key={`empty-${i}`}></span>)}
                      {daysArray.map((_, i) => {
                        const dayNum = i + 1;
                        const isHighlighted = highlightedDays.length > 0 &&
                          dateRange &&
                          calendarYear === dateRange.start.getFullYear() &&
                          calendarMonth === dateRange.start.getMonth() &&
                          highlightedDays.includes(dayNum);
                        // Determine if this day is in the future
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const thisDate = new Date(calendarYear, calendarMonth, dayNum);
                        thisDate.setHours(0,0,0,0);
                        const isFuture = thisDate > today;
                        return (
                          <span
                            key={`day-${i}`}
                            onClick={isFuture ? undefined : () => handleDayClick(dayNum)}
                            className={
                              `inline-flex items-center justify-center rounded transition-colors duration-100 ` +
                              (isHighlighted
                                ? 'bg-green-400 text-white font-semibold shadow-sm'
                                : isFuture
                                  ? 'text-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                                  : 'cursor-pointer hover:bg-green-100 text-gray-900')
                            }
                            style={{ minWidth: 38, minHeight: 38, width: 38, height: 38, margin: 1 }}
                            aria-disabled={isFuture}
                          >
                            {dayNum}
                          </span>
                        );
                      })}
                    </div>
                  </div>
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
          {renderTeamMultiSelect(
            'Team',
            teamDropdownOpen,
            setTeamDropdownOpen,
            employees.map(e => e.name),
            searchTeam,
            setSearchTeam,
            '', // No search for selected team
            () => {} // No-op for search setter
          )}
          {renderFilterDropdown('Client', clientDropdownOpen, setClientDropdownOpen, clients, searchClient, setSearchClient)}
          {renderFilterDropdown('Project', projectDropdownOpen, setProjectDropdownOpen, projects, searchProject, setSearchProject)}
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-sky-500 text-white text-sm px-4 py-1.5">APPLY FILTER</Button>
          <Button variant="outline" className="text-sm px-4 py-1.5">CLEAR FILTERS</Button>
        </div>
      </div>
      {/* Timesheet Summary and Charts */}
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Show timesheet for selected employee */}
        {selectedEmployee && (
          <>
            {loadingTimesheet ? (
              <div className="text-gray-500">Loading timesheet...</div>
            ) : employeeTimesheet && (employeeTimesheet.columns && employeeTimesheet.rows || (Array.isArray(employeeTimesheet) && employeeTimesheet.length > 0 && Array.isArray(employeeTimesheet[0]))) ? (
              <div className="timesheet-summary-capture">
                {(() => {
                  // Filter timesheet data by dateRange
                  const { columns, rows } = filterTimesheetByDateRange(employeeTimesheet, dateRange);
                  // Parse timesheet data into chart-friendly format
                  const dateProjectHours: Record<string, Record<string, number>> = {};
                  const projectTotals: Record<string, number> = {};
                  const projectColors: Record<string, string> = {};
                  const colorPalette = [
                    '#1fd446', // green
                    '#13b13b', // dark green
                    '#1f77b4', // blue
                    '#ff7f0e', // orange
                    '#2ca02c', // light green
                    '#d62728', // red
                    '#9467bd', // purple
                    '#8c564b', // brown
                    '#e377c2', // pink
                    '#7f7f7f', // gray
                    '#bcbd22', // olive
                    '#17becf', // cyan
                    '#f44336', // bright red
                    '#2196f3', // bright blue
                    '#ffeb3b', // yellow
                    '#9c27b0', // violet
                    '#00bcd4', // teal
                    '#ffc107', // amber
                    '#4caf50', // medium green
                    '#795548'  // deep brown
                  ];
                  let colorIdx = 0;
                  columns.forEach((date, colIdx) => {
                    rows.forEach(row => {
                      const cell = row[colIdx];
                      if (cell) {
                        const entries = cell.includes('||') ? cell.split('||') : [cell];
                        entries.forEach(entry => {
                          const [project, task, start, end] = entry.split('|').map(s => s.trim());
                          if (project && start && end) {
                            const parseTime = (t: string) => {
                              const [h, m, s] = t.split(':').map(Number);
                              return h * 60 + m + (s ? s / 60 : 0);
                            };
                            const startMins = parseTime(start);
                            const endMins = parseTime(end);
                            let hours = (endMins - startMins) / 60;
                            if (hours < 0) hours += 24;
                            if (!dateProjectHours[date]) dateProjectHours[date] = {};
                            if (!dateProjectHours[date][project]) dateProjectHours[date][project] = 0;
                            dateProjectHours[date][project] += hours;
                            if (!projectTotals[project]) projectTotals[project] = 0;
                            projectTotals[project] += hours;
                            if (!projectColors[project]) {
                              projectColors[project] = colorPalette[colorIdx % colorPalette.length];
                              colorIdx++;
                            }
                          }
                        });
                      }
                    });
                  });
                  // Bar chart: x = dates, y = hours, stacked by project
                  let barLabels: string[] = [];
                  let barDatasets;
                  const projects = Object.keys(projectTotals);
                  if (columns.length === 1 && dateRange && dateRange.start.getTime() === dateRange.end.getTime()) {
                    // Only one date selected, show that date as label
                    const d = new Date(columns[0]);
                    let label = columns[0];
                    if (!isNaN(d.getTime())) {
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      const day = d.toLocaleDateString(undefined, { weekday: 'short' });
                      label = `${mm}/${dd} (${day})`;
                    }
                    barLabels = [label];
                    barDatasets = projects.map(project => ({
                      label: project,
                      data: [dateProjectHours[columns[0]]?.[project] || 0],
                      backgroundColor: projectColors[project],
                      stack: 'projects',
                    }));
                  } else {
                    // Multiple dates
                    barLabels = columns.map(date => {
                      try {
                        const d = new Date(date);
                        if (!isNaN(d.getTime())) {
                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                          const dd = String(d.getDate()).padStart(2, '0');
                          const day = d.toLocaleDateString(undefined, { weekday: 'short' });
                          return `${mm}/${dd} (${day})`;
                        }
                      } catch {}
                      return date;
                    });
                    barDatasets = projects.map(project => ({
                      label: project,
                      data: columns.map(date => dateProjectHours[date]?.[project] || 0),
                      backgroundColor: projectColors[project],
                      stack: 'projects',
                    }));
                  }
                  const barData = {
                    labels: barLabels,
                    datasets: barDatasets,
                  };
                  const barOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: true },
                      datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top' as const,
                        color: '#222',
                        font: { weight: 'bold', size: 14 },
                        formatter: function(value, context) {
                          // Only show label on top of the stack (last dataset)
                          const datasetIndex = context.datasetIndex;
                          const dataIndex = context.dataIndex;
                          if (datasetIndex === context.chart.data.datasets.length - 1) {
                            let sum = 0;
                            context.chart.data.datasets.forEach(ds => {
                              sum += ds.data[dataIndex] || 0;
                            });
                            if (sum > 0) {
                              const h = Math.floor(sum);
                              const m = Math.round((sum - h) * 60);
                              let label = '';
                              if (h > 0) label += `${h}h`;
                              if (m > 0) label += (h > 0 ? ' ' : '') + `${m}m`;
                              return label || '';
                            }
                          }
                          return '';
                        },
                      },
                    },
                    scales: {
                      x: {
                        stacked: true,
                        ticks: {
                          autoSkip: false,
                          maxRotation: 45,
                          minRotation: 0,
                          font: { size: Math.max(10, 14 - Math.floor(barLabels.length / 7)) },
                        },
                        grid: { display: false },
                      },
                      y: {
                        stacked: true,
                        beginAtZero: true,
                        title: { display: true, text: 'Hours' },
                        ticks: {
                          callback: (value) => `${value}h`,
                          font: { size: 12 },
                        },
                      },
                    },
                    barPercentage: barLabels.length <= 7 ? 0.6 : barLabels.length <= 14 ? 0.5 : 0.35,
                    categoryPercentage: barLabels.length <= 7 ? 0.7 : barLabels.length <= 14 ? 0.6 : 0.45,
                  };
                  // Pie chart: project totals
                  const donutData = {
                    labels: projects,
                    datasets: [
                      {
                        data: projects.map(p => projectTotals[p]),
                        backgroundColor: projects.map(p => projectColors[p]),
                        borderWidth: 0,
                      },
                    ],
                  };
                  // Total time string
                  const totalMins = Object.values(projectTotals).reduce((a, b) => a + b * 60, 0);
                  const pad = (n: number) => n.toString().padStart(2, '0');
                  const totalH = Math.floor(totalMins / 60);
                  const totalM = Math.floor(totalMins % 60);
                  const totalS = Math.round((totalMins * 60) % 60);
                  const totalTimeStr = `${pad(totalH)}:${pad(totalM)}:${pad(totalS)}`;
                  return (
                    <>
                      {/* Bar Chart Card */}
                      <Card className="w-full mt-6 bar-chart-card">
                        <CardContent className="pt-6">
                          <h3 className="text-lg font-semibold mb-4">Summary</h3>
                          <div className={styles.barChartContainer}>
                            <Bar data={barData} options={barOptions} height={120} />
                          </div>
                        </CardContent>
                      </Card>
                      <br/>
                      {/* Pie Chart and Project Details Card */}
                      <Card className={`w-full pie-chart-card`}>
                        <CardContent className="pt-0 pb-6 mt-5">
                          <div className="flex flex-row gap-8 items-start w-full">
                            {/* Project details list and summary */}
                            <div className="flex flex-col flex-1 min-w-[420px] max-w-2xl justify-start mx-auto">
                              <h4 className="text-base font-semibold mb-1">Project Details</h4>
                              <div className={styles.projectTableScroll}>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-gray-500 sticky top-0 bg-white z-10">
                                      <th className="py-1 pr-4 font-medium">Project</th>
                                      <th className="py-1 font-medium">Worked Time</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {projects.map((project, idx) => {
                                      const hours = projectTotals[project] || 0;
                                      const h = Math.floor(hours);
                                      const m = Math.floor((hours - h) * 60);
                                      const s = Math.round(((hours - h) * 60 - m) * 60);
                                      const timeStr = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                                      const colorClasses = [
                                        styles.projectColorDotGreen1,
                                        styles.projectColorDotGreen2,
                                        styles.projectColorDotBlue,
                                        styles.projectColorDotOrange,
                                        styles.projectColorDotGreen3,
                                        styles.projectColorDotRed,
                                        styles.projectColorDotPurple,
                                        styles.projectColorDotBrown,
                                        styles.projectColorDotPink,
                                        styles.projectColorDotGray,
                                        styles.projectColorDotOlive,
                                        styles.projectColorDotCyan,
                                      ];
                                      const colorClass = colorClasses[idx % colorClasses.length];
                                      return (
                                        <tr key={project} className="border-b border-gray-100">
                                          <td className="py-1 pr-4 flex items-center gap-2">
                                            <span className={`${styles.projectColorDot} ${colorClass}`}></span>
                                            <span>{project}</span>
                                          </td>
                                          <td className="py-1 tabular-nums text-gray-700">{timeStr} h</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            {/* Pie chart, centered and allowed to grow */}
                            <div className="flex flex-1 items-center justify-center">
                              <div className={`${styles.pieChartContainerWide}`}>
                                <Doughnut
                                  data={donutData}
                                  options={{
                                    cutout: '70%',
                                    plugins: {
                                      legend: { display: true },
                                      datalabels: { display: false }, // Hide datalabels on pie chart
                                      tooltip: {
                                        callbacks: {
                                          label: function(context) {
                                            const value = context.parsed;
                                            return `${value.toFixed(2)}`;
                                          }
                                        }
                                      }
                                    }
                                  }}
                                />
                                <div className={styles.pieChartTotalTime}>{totalTimeStr}</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-gray-500">No timesheet data available.</div>
            )}
          </>
        )}
        {/* ...existing code for charts and summary can be placed here if needed... */}
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