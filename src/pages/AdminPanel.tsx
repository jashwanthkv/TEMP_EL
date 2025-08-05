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
import RequireLogin from '@/components/ui/RequireLogin';

type LeaveEntry = {
  status?: string;
};

type LeaveData = {
  leaveHistory?: LeaveEntry[];
};

type DocumentRequest = {
  status?: string;
};

type NewsItem = {
  title: string;
  description: string;
  image: string;
  fullText: string;
};

const AdminPanel = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  const navigate = useNavigate();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Dynamic state for statistics
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [pendingLeaves, setPendingLeaves] = useState<number>(0);
  const [activeProjects, setActiveProjects] = useState<number>(0);
  const [pendingDocuments, setPendingDocuments] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [timesheetLoading, setTimesheetLoading] = useState(true);

  // Dynamic project state
  const [projects, setProjects] = useState<Array<{ name: string; client?: string; status?: string }>>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('');

  const statCards = [
    { 
      title: statsLoading ? '...' : totalEmployees.toString(), 
      subtitle: 'Total Employees', 
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      trend: 'Active employees'
    },
    { 
      title: statsLoading ? '...' : pendingLeaves.toString(), 
      subtitle: 'Pending Leaves', 
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      trend: 'Requires approval'
    },
    { 
      title: statsLoading ? '...' : projects.length.toString(), 
      subtitle: 'Total Projects', 
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: `${activeProjects} active projects`
    },
    { 
      title: statsLoading ? '...' : pendingDocuments.toString(), 
      subtitle: 'Documents Pending', 
      icon: FileCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: 'Requires review'
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
  
  // URLs for fetching data
  const EMPLOYEE_API_URL = 'https://script.google.com/macros/s/AKfycbxeKUf-9LFaMvH8tBa9jGuTMz5_h1Uk9N85cjtdNeyl1xLn16bDZqBZZPHonj-6Ba94_w/exec';
  const PROJECT_API_URL = 'https://script.google.com/macros/s/AKfycbwWy9JiCu0WPRQjDyEe5tG6LrdQSxIYkLPJS94bsOJsQwRovMz24oADW9SaY3EddjwT/exec';
  const LEAVE_API_URL = 'https://script.google.com/macros/s/AKfycbwiM7SKXbTc0EYAqDqUjRrwzJq8c2_8gYVd_tOi85TV1TRlqSxYI7x91YG4gHt65d5HWw/exec';
  const DOC_API_URL = 'https://script.google.com/macros/s/AKfycbzcgXozG8UVlaZLUXe3BMJ_TrPS-VMBtkWftPOoUwJSq3ct1GHPAcfJ5Ly7hkcOfCFDXg/exec';
  const TIMESHEET_API_URL = 'https://script.google.com/macros/s/AKfycbyo3pCBPS_ZvK6h4kQbmOU_cZtUnEr4Lw_SbuPZ9Zi3C6pLsk0CFxMYA196bvFwY0XcvA/exec';

  // Dynamic project breakdown data
  const [weeklyProjectBreakdown, setWeeklyProjectBreakdown] = useState<Record<string, { day: string; hours: number }[]>>({});
  
  // Function to fetch pending leaves for a specific employee (Dashboard.tsx pattern)
  const fetchEmployeePendingLeaves = async (sheetId: string, employeeId: string): Promise<number> => {
    try {
      const callbackName = 'pendingLeaveCallback_' + Math.round(100000 * Math.random());
      return await new Promise((resolve, reject) => {
        (window as any)[callbackName] = (data: any) => {
          let count = 0;
          if (Array.isArray(data)) {
            count = data.filter((entry: any) => entry.status?.toLowerCase() === 'pending').length;
          } else if (data.leaveHistory) {
            count = (data.leaveHistory as any[]).filter((entry: any) => entry.status?.toLowerCase() === 'pending').length;
          }
          console.log(`Employee ${employeeId} has ${count} pending leave requests`);
          delete (window as any)[callbackName];
          resolve(count);
        };
        const script = document.createElement('script');
        script.src = `${LEAVE_API_URL}?sheetId=${sheetId}&callback=${callbackName}`;
        script.onerror = () => {
          delete (window as any)[callbackName];
          console.error(`JSONP request failed for employee ${employeeId} leaves`);
          resolve(0);
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error(`Error fetching leaves for employee ${employeeId}:`, error);
      return 0;
    }
  };

  // Function to fetch pending documents for a specific employee (Dashboard.tsx pattern)
  const fetchEmployeePendingDocs = async (spreadsheetId: string, employeeId: string): Promise<number> => {
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'getAllHistory');
      formData.append('spreadsheetId', spreadsheetId);
      const response = await fetch(DOC_API_URL, {
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
          const count = result.data.filter((req: any) => req.status?.toLowerCase() === 'pending').length;
          console.log(`Employee ${employeeId} has ${count} pending document requests`);
          return count;
        } else {
          console.log(`No document data found for employee ${employeeId}`);
          return 0;
        }
      } else {
        console.error(`Failed to fetch document requests for employee ${employeeId}`);
        return 0;
      }
    } catch (error) {
      console.error(`Error fetching documents for employee ${employeeId}:`, error);
      return 0;
    }
  };

  // Fetch all dynamic data
  useEffect(() => {
    const fetchAllData = async () => {
      setStatsLoading(true);
      setProjectsLoading(true);
      setTimesheetLoading(true);

      try {
        // Use the Google Apps Script function to get all employees with action parameter
        console.log('Fetching all employees using getAllEmployees action...');
        
        // Call the getAllEmployees function with action parameter
        const employeesResponse = await fetch(`${TIMESHEET_API_URL}?action=getAllEmployees`);
        const employeesData = await employeesResponse.json();
        
        console.log('✅ Employee data received:', employeesData);
        console.log('✅ Employee count:', employeesData.length);
        console.log('✅ First employee:', employeesData[0]);
        
        // Validate that we have an array
        if (Array.isArray(employeesData) && employeesData.length > 0) {
          setTotalEmployees(employeesData.length);
          console.log(`✅ Successfully loaded ${employeesData.length} employees`);
          
          // Log employee structure for verification
          console.log('Employee data structure:', {
            totalEmployees: employeesData.length,
            firstEmployee: employeesData[0],
            hasSheetId: employeesData.every(emp => emp.SHEETID)
          });
        } else {
          console.error('❌ Invalid employee data received, trying alternative endpoint');
          
          // Try alternative endpoint for employee data
          console.log('Trying alternative employee endpoint...');
          const altEmployeesResponse = await fetch(`${EMPLOYEE_API_URL}?type=employees`);
          const altEmployeesData = await altEmployeesResponse.json();
          
          console.log('Alternative employee data:', altEmployeesData);
          
          if (Array.isArray(altEmployeesData) && altEmployeesData.length > 0) {
            setTotalEmployees(altEmployeesData.length);
            console.log(`✅ Successfully loaded ${altEmployeesData.length} employees from alternative endpoint`);
            
            // Use alternative data for further processing
            await fetchProjectTimesheetData(altEmployeesData, []);
            return;
          } else {
            console.error('❌ Both employee endpoints failed');
            setTotalEmployees(0);
            return;
          }
        }

        // Fetch projects
        console.log('Fetching projects...');
        const projectsResponse = await fetch(`${PROJECT_API_URL}?action=list`);
        const projectsData = await projectsResponse.json();
        
        console.log('Raw projects data:', projectsData);
        
        if (Array.isArray(projectsData)) {
          // Filter for active projects only (like in Timesheet.tsx)
          const activeProjectsData = projectsData.filter(p => 
            p.status === 'Active' || p.status === 'active' || !p.status
          );
          
          setProjects(activeProjectsData);
          setActiveProjects(activeProjectsData.length);
          console.log(`Found ${projectsData.length} total projects, ${activeProjectsData.length} active projects`);
          console.log('Active projects:', activeProjectsData.map(p => p.name));
          
          // Set first active project as selected if none selected
          if (activeProjectsData.length > 0 && !selectedProject) {
            setSelectedProject(activeProjectsData[0].name);
            console.log(`Selected first project: ${activeProjectsData[0].name}`);
          }
        } else {
          console.error('Projects data is not an array:', typeof projectsData);
          setProjects([]);
          setActiveProjects(0);
        }

        // Fetch pending leaves and documents from ALL employees using their SHEETID
        console.log('Fetching pending requests from all employees using their individual SHEETID...');
        let totalPendingLeaves = 0;
        let totalPendingDocs = 0;

        // Process each employee to get their pending requests
        for (const employee of employeesData) {
          if (employee.SHEETID) {
            console.log(`Processing employee ${employee.EMP_NAME} (ID: ${employee.EMP_ID}) with SHEETID: ${employee.SHEETID}`);
            
            // Fetch leave requests for this employee using their individual SHEETID
            const leaveCount = await fetchEmployeePendingLeaves(employee.SHEETID, employee.EMP_ID);
            totalPendingLeaves += leaveCount;

            // Fetch document requests for this employee using their individual SHEETID
            const docCount = await fetchEmployeePendingDocs(employee.SHEETID, employee.EMP_ID);
            totalPendingDocs += docCount;
          } else {
            console.log(`Employee ${employee.EMP_NAME} has no SHEETID, skipping...`);
          }
        }

        setPendingLeaves(totalPendingLeaves);
        setPendingDocuments(totalPendingDocs);
        console.log(`=== FINAL TOTALS ===`);
        console.log(`Total pending leaves across all employees: ${totalPendingLeaves}`);
        console.log(`Total pending documents across all employees: ${totalPendingDocs}`);
        console.log(`Successfully processed ${employeesData.length} employees`);

        // Fetch timesheet data for projects
        console.log('Fetching timesheet data for projects...');
        await fetchProjectTimesheetData(employeesData, projectsData || []);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setStatsLoading(false);
        setProjectsLoading(false);
        setTimesheetLoading(false);
      }
    };

    fetchAllData();
  }, [selectedProject]);
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
  
  // State to store full month project data for accurate monthly calculations
  const [monthlyProjectData, setMonthlyProjectData] = useState<Record<string, number>>({});

  // Fetch timesheet data for projects
  const fetchProjectTimesheetData = async (employees: Array<{ EMP_ID: number; EMP_NAME: string }>, projects: Array<{ name: string; client?: string; status?: string }>) => {
    if (!employees || !projects) {
      console.log('No employees or projects data available');
      return;
    }

    console.log('=== FETCHING PROJECT TIMESHEET DATA ===');
    console.log('Processing', employees.length, 'employees and', projects.length, 'projects');

    const projectBreakdown: Record<string, { day: string; hours: number }[]> = {};
    const projectMonthlyTotals: Record<string, number> = {}; // Store full month totals for each project
    
    try {
      // Fetch timesheet data for all employees
      const timesheetPromises = employees.map(async (employee) => {
        try {
          const url = `${EMPLOYEE_API_URL}?type=timesheet&empId=${encodeURIComponent(employee.EMP_ID)}`;
          console.log(`Fetching timesheet for ${employee.EMP_NAME} (ID: ${employee.EMP_ID})`);
          const response = await fetch(url);
          const timesheetData = await response.json();
          
          console.log(`Timesheet response for ${employee.EMP_NAME}:`, {
            hasColumns: !!timesheetData.columns,
            hasRows: !!timesheetData.rows,
            columnCount: timesheetData.columns?.length || 0,
            rowCount: timesheetData.rows?.length || 0
          });
          
          return { employeeId: employee.EMP_ID, employeeName: employee.EMP_NAME, timesheet: timesheetData };
        } catch (error) {
          console.error(`Error fetching timesheet for employee ${employee.EMP_ID}:`, error);
          return { employeeId: employee.EMP_ID, employeeName: employee.EMP_NAME, timesheet: null };
        }
      });

      const timesheetResults = await Promise.all(timesheetPromises);
      
      // Process timesheet data to calculate project hours
      const projectTotals: Record<string, Record<string, number>> = {}; // project -> day -> hours
      
      // Get current month info
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentDay = today.getDate();
      
      timesheetResults.forEach(({ employeeId, employeeName, timesheet }) => {
        if (!timesheet || !timesheet.columns || !timesheet.rows) {
          console.log(`No timesheet data for ${employeeName}`);
          return;
        }
        
        const { columns, rows } = timesheet;
        console.log(`Processing timesheet for ${employeeName} with ${columns.length} columns and ${rows.length} rows`);
        console.log(`First 3 columns:`, columns.slice(0, 3));
        console.log(`First 3 rows:`, rows.slice(0, 3));
        
        // Debug: Check if we have any data at all in the timesheet
        let hasAnyData = false;
        rows.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            if (cell && typeof cell === 'string' && cell.trim() !== '') {
              hasAnyData = true;
              console.log(`📋 Found data at [${rowIndex}][${colIndex}]: ${cell.substring(0, 50)}${cell.length > 50 ? '...' : ''}`);
            }
          });
        });
        console.log(`📊 Employee ${employeeName} has data in timesheet: ${hasAnyData}`);
        
        // Get last 7 days for chart display
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          if (date.getDay() !== 0 && date.getDay() !== 6) { // Exclude weekends
            last7Days.push({
              date: date.toISOString().split('T')[0],
              day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
            });
          }
        }
        
        // Only take first 5 workdays for chart
        const workDays = last7Days.slice(-5);
        console.log('Target work days for chart:', workDays);
        
        // Process each date column in timesheet for BOTH chart and monthly data
        columns.forEach((column, colIndex) => {
          const columnDate = column.split('T')[0]; // Extract date part
          const columnDateObj = new Date(columnDate);
          
          // Check if this date is in current month and already passed
          const isCurrentMonth = columnDateObj.getMonth() === currentMonth && columnDateObj.getFullYear() === currentYear;
          const isPastDate = columnDateObj.getDate() <= currentDay;
          
          console.log(`🔍 Processing column date: ${columnDate}`, {
            isCurrentMonth,
            isPastDate,
            columnMonth: columnDateObj.getMonth(),
            currentMonth,
            columnYear: columnDateObj.getFullYear(),
            currentYear,
            columnDay: columnDateObj.getDate(),
            currentDay
          });
          
          // For chart display (recent week only)
          const workDay = workDays.find(wd => wd.date === columnDate);
          
          if (workDay) {
            console.log(`✅ Processing ${employeeName} timesheet for CHART: ${columnDate} (${workDay.day})`);
          }
          
          // For monthly calculation (include ALL dates with data for now to get ANY timesheet data)
          // Later we can make this more restrictive once we have data showing
          const shouldProcessForMonthly = true; // Process ALL dates with data for debugging
          
          if (shouldProcessForMonthly) {
            console.log(`📅 Processing ${employeeName} timesheet for MONTHLY: ${columnDate}`);
            
            // Process all entries for this date
            rows.forEach((row, rowIndex) => {
              const cellValue = row[colIndex];
              if (cellValue && typeof cellValue === 'string' && cellValue.trim() !== '') {
                console.log(`📋 Found data in cell [${rowIndex}][${colIndex}]: ${cellValue}`);
                
                // Handle multiple entries separated by '||'
                const entries = cellValue.split('||');
                entries.forEach(entry => {
                  const parts = entry.split('|');
                  if (parts.length >= 4) {
                    const projectName = parts[0]?.trim();
                    const task = parts[1]?.trim();
                    const startTime = parts[2]?.trim();
                    const endTime = parts[3]?.trim();
                    
                    console.log(`🎯 Entry parts:`, { projectName, task, startTime, endTime });
                    
                    // Calculate hours if both start and end times exist
                    if (projectName && startTime && endTime) {
                      try {
                        const start = new Date(`2000-01-01 ${startTime}`);
                        const end = new Date(`2000-01-01 ${endTime}`);
                        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        
                        console.log(`⏰ Time calculation: ${startTime} to ${endTime} = ${hours} hours`);
                        
                        if (hours > 0) {
                          // For chart data (recent week only)
                          if (workDay) {
                            if (!projectTotals[projectName]) {
                              projectTotals[projectName] = {};
                            }
                            if (!projectTotals[projectName][workDay.day]) {
                              projectTotals[projectName][workDay.day] = 0;
                            }
                            projectTotals[projectName][workDay.day] += hours;
                            console.log(`📊 Added ${hours.toFixed(2)} hours to "${projectName}" on ${workDay.day} (${columnDate}) for ${employeeName}`);
                          }
                          
                          // For monthly totals (all dates with data for now)
                          if (!projectMonthlyTotals[projectName]) {
                            projectMonthlyTotals[projectName] = 0;
                          }
                          projectMonthlyTotals[projectName] += hours;
                          console.log(`📅 Added ${hours.toFixed(2)} hours to MONTHLY total for "${projectName}" on ${columnDate} for ${employeeName}`);
                        }
                      } catch (error) {
                        console.error(`Error calculating hours for ${projectName}:`, error);
                      }
                    }
                  }
                });
              }
            });
          } else {
            console.log(`⏭️ Skipping ${columnDate} (not in target criteria)`);
          }
        });
      });
      
      // Convert projectTotals to the format expected by the chart
      // Keep X-axis labels normal, but shift the bar data by one day
      const displayDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']; // Keep normal X-axis labels
      const dataDays = ['Fri', 'Mon', 'Tue', 'Wed', 'Thu']; // Data shifted: Fri->Mon, Mon->Tue, etc.
      
      projects.forEach(project => {
        const projectData = projectTotals[project.name] || {};
        
        // Map shifted data to normal display labels
        projectBreakdown[project.name] = displayDays.map((displayDay, index) => ({
          day: displayDay, // Keep normal X-axis label
          hours: Math.round((projectData[dataDays[index]] || 0) * 10) / 10 // Use shifted day's data
        }));
        
        const totalHours = projectBreakdown[project.name].reduce((sum, entry) => sum + entry.hours, 0);
        console.log(`📈 Project "${project.name}" with shifted bars (Fri data->Mon bar, Mon data->Tue bar, etc.):`, 
          projectBreakdown[project.name].map((entry, i) => `${entry.day} bar: ${entry.hours}h (from ${dataDays[i]} data)`).join(', '),
          `(Total: ${totalHours} hours)`
        );
        
        // Initialize monthly total if not exists
        if (!projectMonthlyTotals[project.name]) {
          projectMonthlyTotals[project.name] = 0;
        }
      });
      
      console.log('=== MONTHLY PROJECT TOTALS ===');
      Object.entries(projectMonthlyTotals).forEach(([project, hours]) => {
        console.log(`${project}: ${hours.toFixed(2)} hours (completed dates only)`);
      });
      
      // Store monthly data for calculations
      setMonthlyProjectData(projectMonthlyTotals);
      
      console.log('=== PROJECT TIMESHEET PROCESSING COMPLETE ===');
      
    } catch (error) {
      console.error('Error processing timesheet data:', error);
      
      // Fallback to empty data structure with normal X-axis labels
      const fallbackDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']; // Keep normal labels
      projects.forEach(project => {
        projectBreakdown[project.name] = fallbackDays.map(day => ({ day, hours: 0 }));
        projectMonthlyTotals[project.name] = 0;
      });
      setMonthlyProjectData(projectMonthlyTotals);
      console.log('Using fallback empty data structure with normal X-axis labels');
    }
    
    setWeeklyProjectBreakdown(projectBreakdown);
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

          <button
                  onClick={() => navigate('/admin/notifications')}
                  className="relative text-green-800 hover:text-green-900"
                >
                  <Bell className="h-5 w-5" />
                </button>
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(prev => !prev)}
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              title="User Profile Menu"
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
                    console.log('AdminPanel logout initiated...');
                    console.log('localStorage before clear:', { ...localStorage });
                    localStorage.clear();
                    console.log('localStorage after clear:', { ...localStorage });
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
                    {timesheetLoading ? (
                      <div className="space-y-3">
                        <div className="bg-muted p-4 rounded-lg shadow-sm animate-pulse">
                          <div className="h-4 bg-gray-300 rounded mb-2"></div>
                          <div className="h-6 bg-gray-300 rounded"></div>
                        </div>
                        <div className="bg-muted p-4 rounded-lg shadow-sm animate-pulse">
                          <div className="h-4 bg-gray-300 rounded mb-2"></div>
                          <div className="h-6 bg-gray-300 rounded"></div>
                        </div>
                        <div className="bg-muted p-4 rounded-lg shadow-sm animate-pulse">
                          <div className="h-4 bg-gray-300 rounded mb-2"></div>
                          <div className="h-6 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                    ) : selectedProject && (() => {
                      const weeklyData = weeklyProjectBreakdown[selectedProject] || [];
                      const totalWeeklyHours = weeklyData.reduce((sum, entry) => sum + entry.hours, 0);
                      
                      // Calculate monthly hours using actual timesheet data for completed dates
                      const today = new Date();
                      const currentDay = today.getDate(); // Current day of the month (1-31)
                      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(); // Total days in current month
                      
                      // Get actual hours from timesheet for completed dates (from monthlyProjectData)
                      const actualMonthlyHours = monthlyProjectData[selectedProject] || 0;
                      
                      // Future dates have 0 hours (no prediction, just actual data)
                      const futureHours = 0;
                      
                      // Total monthly hours = actual completed hours + 0 for future dates
                      const totalMonthlyHours = actualMonthlyHours + futureHours;
                      
                      // Average = total monthly hours ÷ total days in month
                      const averageHoursPerDay = totalMonthlyHours / daysInMonth;

                      return (
                        <div className="space-y-3">
                          <div className="bg-gradient-to-r from-[#5eead4] via-[#2dd4bf] to-[#14b8a6] text-white p-4 rounded-lg shadow">
                            <p className="text-sm">Selected Project</p>
                            <p className="text-xl font-bold">{selectedProject}</p>
                          </div>
                          <div className="bg-muted p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500">Total Weekly Hours</p>
                            <p className="text-xl font-bold text-primary">{totalWeeklyHours.toFixed(1)} hrs</p>
                          </div>
                          <div className="bg-muted p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500">Total Monthly Hours</p>
                            <p className="text-xl font-bold text-primary">{totalMonthlyHours.toFixed(1)} hrs</p>
                            <p className="text-xs text-gray-400">
                              {actualMonthlyHours.toFixed(1)}h actual + {futureHours.toFixed(1)}h future
                            </p>
                            <p className="text-xs text-gray-400">
                              {currentDay} days completed, {daysInMonth - currentDay} remaining | Avg: {averageHoursPerDay.toFixed(1)}h/day
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* RIGHT SIDE: Enhanced Bar Chart */}
                  <div className="col-span-2 w-full h-72">
                    {timesheetLoading ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Loading timesheet data...</p>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={weeklyProjectBreakdown[selectedProject] || []}
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
                    )}
                    {clickedBar && !timesheetLoading && (
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
      {projectsLoading ? (
        <div className="text-center py-4 text-muted-foreground">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">No projects found</div>
      ) : (
        projects.map((project, idx) => {
        const weeklyData = weeklyProjectBreakdown[project.name] || [];
        const totalHours = weeklyData.reduce((sum, entry) => sum + entry.hours, 0);
        const isSelected = selectedProject === project.name;

        return (
          <div
            key={idx}
            onClick={() => {
            setSelectedProject(project.name);
            setClickedBar(null); // clear previous bar selection
          }}

            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              isSelected
                ? 'bg-gradient-to-r from-[#5eead4] via-[#2dd4bf] to-[#14b8a6] text-white shadow-lg'
                : 'bg-muted hover:bg-muted/70 text-gray-800 border-muted'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-semibold">{project.name}</h4>
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
                className={`h-2 rounded-full transition-all ${
                  totalHours >= 30
                    ? 'bg-green-500'
                    : totalHours >= 15
                    ? 'bg-gray-400'
                    : 'bg-red-400'
                }`}
                {...({
                  style: {
                    width: `${Math.min((totalHours / 40) * 100, 100)}%`
                  }
                })}
              />
            </div>
          </div>
        );
      }))}
    </div>
  </CardContent>
</Card>

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

export default AdminPanel;