import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, User, UserCircle, Home, FileDown, TrendingUp, Clock, Award, BarChart3, ChevronsUp, ChevronsDown, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RequireLogin from '@/components/ui/RequireLogin';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Cell
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type Employee = {
  id: string;
  name: string;
  designation?: string;
};

type WeeklyData = {
  week: string;
  hours: number;
  coursesCompleted: number;
};

type TimesheetEntry = {
  date: string;
  project: string;
  task: string;
  start: string;
  end: string;
  hours: number;
};

type Course = {
  name: string;
  platform: string;
  deadline: string;
  link: string;
  topic: string;
};

const CHART_COLORS = {
  workingHours: '#16a34a',
  courses: '#2563eb'
};

// API URLs
const EMPLOYEE_API_URL = 'https://script.google.com/macros/s/AKfycbxeKUf-9LFaMvH8tBa9jGuTMz5_h1Uk9N85cjtdNeyl1xLn16bDZqBZZPHonj-6Ba94_w/exec';
const TRAINING_API_URL = 'https://script.google.com/macros/s/AKfycbwAlAIg39DiQgbYnlivOr9zIowb_2Y3iW9o1kDFBItgMYPxqewxeLX1b7hbrXs61MeWAA/exec';

// Constants
const months = [
  'All Months',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AdminAnalytics = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedWeekData, setSelectedWeekData] = useState<WeeklyData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const years = ['2023', '2024', '2025'];

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${EMPLOYEE_API_URL}?type=employeeList`);
      const data = await response.json();
      setEmployees(data || []);
      // Don't auto-select employee, let user choose
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  // Fetch timesheet data for selected employee, month, and year
  const fetchTimesheetData = async (empId: string, month: string, year: string) => {
    if (!empId) return;
    
    try {
      const response = await fetch(`${EMPLOYEE_API_URL}?type=timesheet&empId=${encodeURIComponent(empId)}`);
      const data = await response.json();
      
      let columns = [];
      let rows = [];
      
      if (data.columns && data.rows) {
        columns = data.columns;
        rows = data.rows;
      } else if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
        columns = data[0];
        rows = data.slice(1);
      }

      // Parse timesheet entries
      const entries: TimesheetEntry[] = [];
      rows.forEach((row: string[]) => {
        row.forEach((cell: string, colIdx: number) => {
          if (cell && typeof cell === 'string' && cell.trim() !== '') {
            const date = columns[colIdx];
            const cellEntries = cell.includes('||') ? cell.split('||') : [cell];
            
            cellEntries.forEach(entry => {
              const parts = entry.split('|').map(s => s.trim());
              if (parts.length >= 4) {
                const [project, task, start, end] = parts;
                
                // Calculate hours
                const parseTime = (t: string) => {
                  const [h, m, s] = t.split(':').map(Number);
                  return h * 60 + m + (s ? s / 60 : 0);
                };
                const startMins = parseTime(start);
                const endMins = parseTime(end);
                let hours = (endMins - startMins) / 60;
                if (hours < 0) hours += 24;
                hours = Math.round(hours * 100) / 100; // Round to 2 decimal places
                
                entries.push({
                  date,
                  project,
                  task,
                  start,
                  end,
                  hours
                });
              }
            });
          }
        });
      });

      // Filter entries by selected month and year
      const filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        const entryMonth = entryDate.toLocaleString('default', { month: 'long' });
        const entryYear = entryDate.getFullYear().toString();
        
        // If "All Months" is selected, only filter by year
        if (month === 'All Months') {
          return entryYear === year;
        }
        
        return entryMonth === month && entryYear === year;
      });

      setTimesheetEntries(filteredEntries);
      return filteredEntries;
    } catch (error) {
      console.error('Error fetching timesheet data:', error);
      setTimesheetEntries([]);
      return [];
    }
  };

  // Fetch completed courses for selected employee
  const fetchCompletedCourses = async (empId: string) => {
    if (!empId) return;
    
    try {
      // Get employee's spreadsheet ID (you might need to store this mapping)
      const sheetId = localStorage.getItem(`employee_${empId}_sheetId`) || localStorage.getItem("spreadsheetId");
      if (!sheetId) {
        console.error("Sheet ID not found for employee");
        return;
      }

      const response = await fetch(`${TRAINING_API_URL}?sheetId=${sheetId}`);
      const data = await response.json();
      setCompletedCourses(data.completed || []);
    } catch (error) {
      console.error('Error fetching completed courses:', error);
      setCompletedCourses([]);
    }
  };

  // Generate weekly data from timesheet entries and completed courses
  const generateWeeklyData = useCallback((entries: TimesheetEntry[], courses: Course[], month: string, year: string): WeeklyData[] => {
    // For "All Months", show monthly data instead of weekly
    if (month === 'All Months') {
      const monthlyData: WeeklyData[] = [
        { week: 'Q1 (Jan-Mar)', hours: 0, coursesCompleted: 0 },
        { week: 'Q2 (Apr-Jun)', hours: 0, coursesCompleted: 0 },
        { week: 'Q3 (Jul-Sep)', hours: 0, coursesCompleted: 0 },
        { week: 'Q4 (Oct-Dec)', hours: 0, coursesCompleted: 0 },
      ];

      entries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const entryMonth = entryDate.getMonth(); // 0-11
        const quarterIndex = Math.floor(entryMonth / 3);
        monthlyData[quarterIndex].hours += entry.hours;
      });

      // Round hours to 2 decimal places
      monthlyData.forEach(quarter => {
        quarter.hours = Math.round(quarter.hours * 100) / 100;
      });

      // Calculate courses completed by quarter
      courses.forEach(course => {
        const deadline = new Date(course.deadline);
        if (deadline.getFullYear() === parseInt(year)) {
          const courseMonth = deadline.getMonth();
          const quarterIndex = Math.floor(courseMonth / 3);
          monthlyData[quarterIndex].coursesCompleted++;
        }
      });

      return monthlyData;
    }

    // Regular weekly data for specific month
    const weeks: WeeklyData[] = [
      { week: 'Week 1', hours: 0, coursesCompleted: 0 },
      { week: 'Week 2', hours: 0, coursesCompleted: 0 },
      { week: 'Week 3', hours: 0, coursesCompleted: 0 },
      { week: 'Week 4', hours: 0, coursesCompleted: 0 },
    ];

    // Calculate hours by week
    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const dayOfMonth = entryDate.getDate();
      const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 3);
      weeks[weekIndex].hours += entry.hours;
    });

    // Round hours to 2 decimal places
    weeks.forEach(week => {
      week.hours = Math.round(week.hours * 100) / 100;
    });

    // Calculate courses completed by week (simplified - you might want to add completion dates to course data)
    const monthIndex = months.findIndex(m => m === month) - 1; // -1 because of "All Months" at index 0
    const coursesInMonth = courses.filter(course => {
      const deadline = new Date(course.deadline);
      return deadline.getMonth() === monthIndex && deadline.getFullYear() === parseInt(year);
    });

    // Distribute courses across weeks (simplified logic)
    coursesInMonth.forEach((_, index) => {
      const weekIndex = index % 4;
      weeks[weekIndex].coursesCompleted++;
    });

    return weeks;
  }, []);

  // Fetch employees on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchEmployees();
      setLoading(false);
    };
    loadInitialData();
  }, []);

  // Fetch data when employee, month, or year changes
  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!selectedEmployee || !selectedMonth || !selectedYear) return;
      
      setLoading(true);
      try {
        // Fetch timesheet and courses in parallel
        const [timesheetEntries, _] = await Promise.all([
          fetchTimesheetData(selectedEmployee, selectedMonth, selectedYear),
          fetchCompletedCourses(selectedEmployee)
        ]);
        
        // Generate weekly data from fetched data
        const weeklyData = generateWeeklyData(timesheetEntries || [], completedCourses, selectedMonth, selectedYear);
        setWeeklyData(weeklyData);
        
        // Find current employee details
        const employee = employees.find(emp => emp.id === selectedEmployee);
        setCurrentEmployee(employee || null);
      } catch (error) {
        console.error('Error loading employee data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployeeData();
  }, [selectedEmployee, selectedMonth, selectedYear, employees, completedCourses, generateWeeklyData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalHours = Math.round(weeklyData.reduce((sum, week) => sum + week.hours, 0) * 100) / 100;
  const totalCourses = weeklyData.reduce((sum, week) => sum + week.coursesCompleted, 0);
  const avgWeeklyHours = Math.round((totalHours / 4) * 100) / 100;

  const handleExportPDF = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear || 
        selectedEmployee === '' || selectedMonth === '' || selectedYear === '') {
      alert('Please select an employee, month, and year before exporting.');
      return;
    }

    if (!contentRef.current) {
      alert('Content not ready for export. Please try again.');
      return;
    }

    setIsExporting(true);
    
    try {
      // Hide the controls section temporarily
      const controlsElement = document.querySelector('.export-controls') as HTMLElement;
      if (controlsElement) {
        controlsElement.style.display = 'none';
      }

      // Wait a moment for the layout to adjust
      await new Promise(resolve => setTimeout(resolve, 100));

      // Take screenshot of the entire content
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: contentRef.current.scrollWidth,
        height: contentRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      // Create PDF in landscape orientation
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit the page
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
      
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;
      
      // Center the image on the page
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      // Convert canvas to image and add to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      // Generate filename with employee details
      const employee = currentEmployee || employees.find(emp => emp.id === selectedEmployee);
      const fileName = `Analytics_${employee?.name.replace(/\s+/g, '_') || 'Employee'}_${selectedMonth}_${selectedYear}.pdf`;
      
      // Save the PDF
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Show the controls section again
      const controlsElement = document.querySelector('.export-controls') as HTMLElement;
      if (controlsElement) {
        controlsElement.style.display = 'block';
      }
      setIsExporting(false);
    }
  };

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const weekData = data.activePayload[0].payload;
      setIsUpdating(true);
      
      // Simulate loading delay
      setTimeout(() => {
        setSelectedWeekData(weekData);
        setIsUpdating(false);
        
        // Highlight selected bar
        const bars = document.querySelectorAll('.recharts-bar-rectangle');
        bars.forEach(bar => {
          bar.classList.remove('bar-selected');
          if (bar.getAttribute('name') === weekData.week) {
            bar.classList.add('bar-selected');
          }
        });
      }, 300);
    }
  };

  const getPerformanceIndicator = (hours: number) => {
    if (hours > 42) {
      return {
        icon: <ChevronsUp className="w-5 h-5 text-green-600" />,
        text: 'Above Target',
        color: 'text-green-600'
      };
    } else if (hours > 38) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-blue-600" />,
        text: 'On Target',
        color: 'text-blue-600'
      };
    } else {
      return {
        icon: <ChevronsDown className="w-5 h-5 text-amber-600" />,
        text: 'Below Target',
        color: 'text-amber-600'
      };
    }
  };

  const performance = selectedWeekData ? getPerformanceIndicator(selectedWeekData.hours) : null;

  return (
    <div ref={contentRef} className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-non">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-muted-foreground">Performance Analytics</p>
          </div>
        </div>
      
        <div className="flex items-center space-x-6">
          <span className="text-lg font-bold text-green-700">EMPWR</span>
      
          <button
            onClick={() => navigate('/admin/notifications')}
            className="relative text-primary hover:text-primary/80"
          >
            <Bell className="h-5 w-5" />
          </button>
      
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(prev => !prev)}
              className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full"
            >
              <User className="w-5 h-5 text-primary" />
            </button>
      
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-popover shadow-lg rounded-lg z-50 border border-border">
                <button
                  onClick={() => {
                    navigate('/admin/profile');
                    setIsProfileOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-800 hover:bg-green-50 flex items-center gap-2"
                >
                  <UserCircle className="w-4 h-4 text-primary" />
                  View Profile
                </button>
              </div>
            )}
          </div>
      
          <button
            onClick={() => navigate('/admin')}
            className="w-10 h-10 flex items-center justify-center text-primary hover:bg-accent rounded-full"
            aria-label="Dashboard"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Controls Section */}
      <div className="px-8 py-6 bg-card border-b border-border export-controls">
        <div className="flex flex-wrap items-center gap-6">
          {/* Employee Selection */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-card-foreground min-w-fit">Employee:</label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-64 h-10">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{employee.name}</span>
                      <span className="text-xs text-muted-foreground">{employee.designation}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Selection */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-card-foreground min-w-fit">Month:</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36 h-10">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selection */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-card-foreground min-w-fit">Year:</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-28 h-10">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export PDF Button */}
          <Button 
            onClick={handleExportPDF}
            disabled={!selectedEmployee || !selectedMonth || !selectedYear || 
                     selectedEmployee === '' || selectedMonth === '' || selectedYear === '' || 
                     isExporting || loading}
            className="gap-2 h-10 px-6 font-medium"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="px-8 py-8 space-y-8">
        {/* Employee Info Card */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold text-card-foreground mb-2">
                  Performance Analysis - {selectedMonth && selectedYear ? `${selectedMonth} ${selectedYear}` : 'Select Period'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <p className="text-lg text-card-foreground font-semibold">
                    {currentEmployee?.name ? `${currentEmployee.name} (${currentEmployee.id})` : 'Select Employee'}
                  </p>
                  {currentEmployee?.designation && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-muted-foreground font-medium">
                        {currentEmployee.designation}
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="flex gap-6">
                <div className="text-center px-4 py-2 bg-secondary rounded-lg border border-border">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">TOTAL HOURS</span>
                  </div>
                  <div className="text-2xl font-bold text-card-foreground">{totalHours}</div>
                </div>
                
                <div className="text-center px-4 py-2 bg-secondary rounded-lg border border-border">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">COURSES</span>
                  </div>
                  <div className="text-2xl font-bold text-card-foreground">{totalCourses}</div>
                </div>

                <div className="text-center px-4 py-2 bg-secondary rounded-lg border border-border">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">AVG/WEEK</span>
                  </div>
                  <div className="text-2xl font-bold text-card-foreground">{avgWeeklyHours}h</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Professional Weekly Performance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-card-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  {selectedMonth === 'All Months' ? 'Quarterly Performance Analysis' : 'Weekly Performance Analysis'}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Click on any {selectedMonth === 'All Months' ? 'quarter' : 'week'} to view detailed metrics
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart 
                    data={weeklyData} 
                    margin={{ top: 20, right: 60, left: 60, bottom: 20 }}
                    barCategoryGap="25%"
                    barGap={8}
                    onClick={handleBarClick}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="week" 
                      tick={{ fontSize: 12, fontWeight: 500, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      label={{ 
                        value: 'Working Hours', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: 'hsl(var(--foreground))' }
                      }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      label={{ 
                        value: 'No of Courses', 
                        angle: 90, 
                        position: 'insideRight',
                        style: { textAnchor: 'middle', fill: 'hsl(var(--foreground))' }
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                      formatter={(value) => (
                        <span className="text-sm text-muted-foreground font-medium">{value}</span>
                      )}
                    />
                    <Bar 
                      dataKey="hours" 
                      name="Working Hours"
                      yAxisId="left"
                      fill={CHART_COLORS.workingHours}
                      radius={[3, 3, 0, 0]}
                      maxBarSize={50}
                      cursor="pointer"
                    >
                      {weeklyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          name={entry.week}
                          className="transition-all duration-200 hover:opacity-80"
                        />
                      ))}
                    </Bar>
                    <Bar 
                      dataKey="coursesCompleted" 
                      name="Courses Completed"
                      yAxisId="right"
                      fill={CHART_COLORS.courses}
                      radius={[3, 3, 0, 0]}
                      maxBarSize={50}
                      cursor="pointer"
                    >
                      {weeklyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          name={entry.week}
                          className="transition-all duration-200 hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Week View */}
          <div className="lg:col-span-1">
            <Card className="border border-border bg-card h-fit">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-card-foreground">
                  {selectedWeekData ? `${selectedWeekData.week} Details` : `${selectedMonth === 'All Months' ? 'Quarter' : 'Week'} Details`}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedWeekData ? 'Performance breakdown' : `Click on a ${selectedMonth === 'All Months' ? 'quarter' : 'week'} to view details`}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {isUpdating ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="mt-4 text-muted-foreground">Loading week data...</p>
                  </div>
                ) : selectedWeekData ? (
                  <>
                    <div className="relative p-4 bg-secondary rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.workingHours }}></div>
                        <span className="text-sm font-medium text-card-foreground">Working Hours</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="text-2xl font-bold text-card-foreground">{selectedWeekData.hours}</div>
                        <div className="text-xs text-muted-foreground mb-1">hours</div>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        {performance?.icon}
                        <span className={`text-xs font-medium ${performance?.color}`}>
                          {performance?.text} (Target: 40h)
                        </span>
                      </div>
                      <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-sm border border-border">
                        {selectedWeekData.hours > 40 ? (
                          <ChevronsUp className="w-5 h-5 text-green-600" />
                        ) : selectedWeekData.hours === 40 ? (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ChevronsDown className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-secondary rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.courses }}></div>
                        <span className="text-sm font-medium text-card-foreground">Courses Completed</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="text-2xl font-bold text-card-foreground">{selectedWeekData.coursesCompleted}</div>
                        <div className="text-xs text-muted-foreground mb-1">courses</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {selectedWeekData.coursesCompleted > 1 ? 
                          'Excellent learning progress!' : 
                          'Keep working on your courses'}
                      </div>
                    </div>

                    <div className="p-4 bg-secondary rounded-lg border border-border">
                      <h3 className="text-sm font-medium text-card-foreground mb-2">Weekly Summary</h3>
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1"></div>
                          <span>
                            {selectedWeekData.hours > 42 ? 'Exceptional' : selectedWeekData.hours > 38 ? 'Solid' : 'Below'} work hours
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1"></div>
                          <span>
                            Completed {selectedWeekData.coursesCompleted} training {selectedWeekData.coursesCompleted === 1 ? 'course' : 'courses'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1"></div>
                          <span>
                            {selectedWeekData.hours > 40 && selectedWeekData.coursesCompleted > 1 ? 
                              'Outstanding performance this week!' : 
                              'Focus on time management next week'}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Select a week from the chart to view detailed performance metrics
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add custom styles for selected bars */}
      <style>{`
        .recharts-bar-rectangle.bar-selected {
          animation: pulse 1.5s ease-in-out 2;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AdminAnalytics;