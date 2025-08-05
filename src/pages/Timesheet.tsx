// Timesheet.tsx
import React, { useEffect, useState, useCallback,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import styles from './Timesheet.module.css';
import {  Bell, Home, User, UserCircle } from 'lucide-react';
import RequireLogin from '@/components/ui/RequireLogin';


const COLORS = ['#FF69B4', '#FFA500', '#00CED1', '#4CAF50', '#8E44AD'];
// Main timesheet actions URL (keep original)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyo3pCBPS_ZvK6h4kQbmOU_cZtUnEr4Lw_SbuPZ9Zi3C6pLsk0CFxMYA196bvFwY0XcvA/exec";
// AdminProject URL for fetching active projects only
const PROJECTS_URL = "https://script.google.com/macros/s/AKfycbwWy9JiCu0WPRQjDyEe5tG6LrdQSxIYkLPJS94bsOJsQwRovMz24oADW9SaY3EddjwT/exec";

// Project names in consistent order for color assignment
const PROJECT_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta'];

// Function to get consistent color for a project
const getProjectColor = (projectName: string) => {
  const index = PROJECT_NAMES.indexOf(projectName);
  return index >= 0 ? COLORS[index % COLORS.length] : COLORS[0];
  
};

interface TimesheetEntry {
  project: string;
  task: string;
  start: string;
  end: string | null;
}

interface DailyLogs {
  [date: string]: TimesheetEntry[];
}

const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

// Calculate elapsed time from server start time
const calculateServerElapsed = (serverStartTime: string): number => {
  if (!serverStartTime) return 0;
  
  const now = new Date();
  const startTime = new Date();
  const [hours, minutes, seconds] = serverStartTime.split(':').map(Number);
  startTime.setHours(hours, minutes, seconds, 0);
  
  // If start time is in the future (next day scenario), subtract a day
  if (startTime > now) {
    startTime.setDate(startTime.getDate() - 1);
  }
  
  return Math.floor((now.getTime() - startTime.getTime()) / 1000);
};

// Generate last 7 days dynamically
const timeSlots = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

const getTopOffset = (start: string) => {
  const [h, m] = start.split(':').map(Number);
  
  // Grid structure:
  // Row 0: Header (80px height)
  // Row 1: 09:00 slot (60px height) 
  // Row 2: 10:00 slot (60px height)
  // Row 3: 11:00 slot (60px height)
  // Row 4: 12:00 slot (60px height)
  // etc.
  
  const headerHeight = 80;
  const timeSlotHeight = 60;
  
  // Calculate which time slot row this time falls into
  // 9:00 = row 1, 10:00 = row 2, 12:00 = row 4, etc.
  const timeSlotRow = h - 9 + 1; // +1 because row 0 is header
  
  // Clamp to valid range
  const clampedTimeSlotRow = Math.max(1, Math.min(10, timeSlotRow)); // rows 1-10 for 9:00-18:00
  
  // Calculate base position: start at the beginning of the time slot row
  const rowStartPosition = headerHeight + (clampedTimeSlotRow - 1) * timeSlotHeight;
  
  // Add minute offset within the time slot
  const minuteOffset = (m / 60) * timeSlotHeight;
  
  const result = rowStartPosition + minuteOffset;
  console.log(`getTopOffset for ${start}: hour=${h}, minute=${m}, timeSlotRow=${timeSlotRow}, rowStartPosition=${rowStartPosition}, minuteOffset=${minuteOffset}, result=${result}`);
  
  return result;
};

const getHeight = (start: string, end: string) => {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  
  // Calculate duration in minutes
  const durationMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
  
  // Convert to pixels: 60px per hour = 1px per minute
  const heightPx = (durationMinutes / 60) * 60;
  
  // Minimum height of 30px for visibility
  const result = Math.max(heightPx, 30);
  console.log(`getHeight for ${start}-${end}: duration=${durationMinutes}min, heightPx=${heightPx}, result=${result}`);
  
  return result;
};

const getRunningHeight = (start: string) => {
  const [h1, m1] = start.split(':').map(Number);
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Calculate duration from start time to current time in minutes
  let durationMinutes = (currentHour * 60 + currentMinute) - (h1 * 60 + m1);
  
  // If duration is negative (task started later in the day), use minimum height
  if (durationMinutes <= 0) {
    return 30; // Minimum height
  }
  
  // If the task has been running for more than a day, cap at reasonable height
  if (durationMinutes > 24 * 60) {
    durationMinutes = 24 * 60; // Cap at 24 hours
  }
  
  // Convert to pixels: 60px per hour = 1px per minute  
  const heightPx = (durationMinutes / 60) * 60;
  
  // Minimum height of 30px for visibility
  return Math.max(heightPx, 30);
};

export default function Timesheet() {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  // State for active projects
  const [activeProjects, setActiveProjects] = useState<string[]>([]);
  const navigate = useNavigate();
  const [project, setProject] = useState('');
  const [task, setTask] = useState('');
  const [breaks, setBreaks] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pausedTime, setPausedTime] = useState(0); // Time spent in pause
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [serverStartTime, setServerStartTime] = useState<string>('');
  const [logs, setLogs] = useState<DailyLogs>({});
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<TimesheetEntry | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [allDates, setAllDates] = useState<string[]>([]); // All dates from backend for filtering
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set()); // Track expanded timesheet entries
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Force re-render for running task heights
  
  
  // Add Entry form state
  const [addEntryProject, setAddEntryProject] = useState('');
  const [addEntryTask, setAddEntryTask] = useState('');
  const [addEntryStartTime, setAddEntryStartTime] = useState('');
  const [addEntryEndTime, setAddEntryEndTime] = useState('');

  // Debug function to check and set spreadsheetId if needed
  const ensureSpreadsheetId = () => {
    let spreadsheetId = localStorage.getItem('spreadsheetId');
    if (!spreadsheetId) {
      console.warn('No spreadsheetId found in localStorage');
      // Set the default spreadsheet ID from the backend
      const defaultSpreadsheetId = '1WGvnJUF5n1ZoKHk5y8DzztYSuKhuNJBb-mquGwiRZ1w';
      localStorage.setItem('spreadsheetId', defaultSpreadsheetId);
      spreadsheetId = defaultSpreadsheetId;
      console.log('Set default spreadsheetId:', spreadsheetId);
    }
    console.log('Current spreadsheetId:', spreadsheetId);
    return spreadsheetId;
  };

  // Enhanced data fetching with multiple strategies
  const fetchTimesheetData = useCallback(async (userEmail: string, empId: string) => {
    console.log(`Attempting to fetch data for email: ${userEmail}, empId: ${empId}`);
    
    const spreadsheetId = localStorage.getItem('spreadsheetId');
    console.log('SpreadsheetId from localStorage:', spreadsheetId);
    
    const requestData = {
      action: 'getLogs',
      email: userEmail,
      empId: empId,
      spreadsheetId: spreadsheetId || ''
    };
    
    console.log('Request data being sent:', requestData);

    // Strategy 1: Direct POST request
    try {
      console.log('Strategy 1: Direct POST request');
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Strategy 1 success:', result);
        return result;
      } else {
        console.log('Strategy 1 failed with status:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.log('Strategy 1 error:', error);
    }

    // Strategy 2: GET request
    try {
      console.log('Strategy 2: GET request');
      const params = new URLSearchParams(requestData);
      const getResponse = await fetch(`${SCRIPT_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (getResponse.ok) {
        const result = await getResponse.json();
        console.log('Strategy 2 success:', result);
        return result;
      } else {
        console.log('Strategy 2 failed with status:', getResponse.status);
        throw new Error(`HTTP ${getResponse.status}`);
      }
    } catch (error) {
      console.log('Strategy 2 error:', error);
    }

    // Strategy 3: POST with CORS mode
    try {
      console.log('Strategy 3: POST with CORS mode');
      const corsResponse = await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams(requestData),
      });

      if (corsResponse.ok) {
        const result = await corsResponse.json();
        console.log('Strategy 3 success:', result);
        return result;
      } else {
        console.log('Strategy 3 failed with status:', corsResponse.status);
        throw new Error(`HTTP ${corsResponse.status}`);
      }
    } catch (error) {
      console.log('Strategy 3 error:', error);
    }

    // If all strategies fail, return null
    console.error('All fetch strategies failed');
    return null;
  }, []);

  // Fetch timesheet data from backend
  const loadTimesheetData = useCallback(async () => {
    try {
      setLoading(true);
      const userEmail = localStorage.getItem('userEmail');
      const empId = localStorage.getItem('userId');
      
      if (!userEmail || !empId) {
        console.log('No user data found');
        return;
      }

      console.log('Fetching timesheet data for:', { userEmail, empId });

      // Use the enhanced fetch function
      const result = await fetchTimesheetData(userEmail, empId);
        
        // Process the result if we got one
        if (result) {
          // Debug logging to see what we actually received
          console.log('Full result object:', result);
          console.log('result.availableDates:', result.availableDates);
          console.log('Type of result.availableDates:', typeof result.availableDates);
          console.log('Is array:', Array.isArray(result.availableDates));
          console.log('Length:', result.availableDates ? result.availableDates.length : 'N/A');
          console.log('result.error:', result.error);
          
          // ALWAYS use available dates from backend if they exist, regardless of logs or errors
          if (result.availableDates && Array.isArray(result.availableDates) && result.availableDates.length > 0) {
            const datesFromBackend = result.availableDates; // These are the last 7 days
            setAvailableDates(datesFromBackend);
            
            // Also store all dates if provided for filtering purposes
            if (result.allDates && Array.isArray(result.allDates)) {
              setAllDates(result.allDates);
              console.log('✅ SUCCESS: Stored all dates for filtering:', result.allDates);
            } else {
              // Fallback: use availableDates as allDates if allDates not provided
              setAllDates(datesFromBackend);
            }
            
            // Convert ISO dates (yyyy-mm-dd) to display format (dd-mm-yyyy)
            const displayDates = datesFromBackend.map(isoDate => {
              if (isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Backend date is in YYYY-MM-DD format, convert to DD-MM-YYYY for display
                const [yyyy, mm, dd] = isoDate.split('-');
                return `${dd}-${mm}-${yyyy}`;
              } else {
                // If backend date is already in another format, use as is for now
                return isoDate;
              }
            });
            setDays(displayDates);
            
            console.log('✅ SUCCESS: Using default dates from backend (last 7 days):', datesFromBackend);
            console.log('✅ SUCCESS: Display dates:', displayDates);
            console.log('Correlation check:');
            displayDates.forEach((displayDate, index) => {
              console.log(`  ${datesFromBackend[index]} -> ${displayDate}`);
            });
          } else {
            // No dates from backend - show empty state
            console.log('❌ FAILED: No availableDates from backend - showing empty state');
            console.log('Condition check results:');
            console.log('  result.availableDates exists:', !!result.availableDates);
            console.log('  is array:', Array.isArray(result.availableDates));
            console.log('  length > 0:', result.availableDates ? result.availableDates.length > 0 : false);
            setDays([]);
            setAvailableDates([]);
            setAllDates([]);
          }
          
          // Filter logs to only include available dates (only if we have logs)
          if (result.logs && typeof result.logs === 'object') {
            const filteredLogs: DailyLogs = {};
            // Use the availableDates we just set (which are in YYYY-MM-DD format from backend)
            const targetDates = result.availableDates || [];

            console.log('Target dates for filtering:', targetDates);
            console.log('Available dates in response:', Object.keys(result.logs));
            console.log('Raw logs object from backend:', result.logs);

            Object.entries(result.logs).forEach(([date, entries]) => {
              // The date from logs should match the availableDates from backend
              console.log(`Checking date: ${date} against target dates`, { includes: targetDates.includes(date) });
              console.log(`Entries for ${date}:`, entries);
              
              // Include ALL logs, not just those in targetDates for better filtering support
              if (entries && (Array.isArray(entries) || typeof entries === 'object')) {
                // Ensure entries is an array and contains valid timesheet entries
                const validEntries = Array.isArray(entries) 
                  ? entries.filter(entry => entry && typeof entry === 'object' && entry.start)
                  : [];
                
                filteredLogs[date] = validEntries as TimesheetEntry[];
                console.log(`Added ${validEntries.length} entries for ${date}`);
              } else {
                console.log(`Date ${date} has invalid entries, skipping`);
              }
            });

            setLogs(filteredLogs);
            console.log('Final filtered logs:', filteredLogs);
            
            // Check for running tasks (entries with empty end time) and restore timer state
            const today = new Date().toISOString().split('T')[0];
            const todayEntries = filteredLogs[today] || [];
            const runningEntry = todayEntries.find(entry => 
              !entry.end || entry.end === '' || entry.end === null
            );
            
            if (runningEntry) {
              console.log('Found running task from backend:', runningEntry);
              
              // Restore timer state
              setTimerRunning(true);
              setTimerPaused(false);
              setCurrentTask({
                project: runningEntry.project,
                task: runningEntry.task,
                start: runningEntry.start,
                end: null
              });
              setServerStartTime(runningEntry.start);
              setProject(runningEntry.project);
              setTask(runningEntry.task);
              
              console.log('Restored running task state after refresh');
            } else {
              console.log('No running task found in today\'s entries');
            }
          } else {
            console.log('No logs in response, setting empty logs');
            setLogs({});
          }
          
          // Log any errors if they exist
          if (result && result.error) {
            console.error('Backend returned error:', result.error);
          }
        } else {
          console.log('No result received from backend');
          setLogs({});
          setDays([]);
          setAvailableDates([]);
          setAllDates([]);
        }
      
      console.log('Timesheet loading completed');
    } catch (error) {
      console.error('Error loading timesheets:', error);
      setLogs({});
      // Show empty state on error instead of generating fallback dates
      console.log('Error occurred - showing empty state');
      setDays([]);
      setAvailableDates([]);
      setAllDates([]);
    } finally {
      setLoading(false);
    }
  }, [fetchTimesheetData]);

  // Fetch active projects from Apps Script (AdminProject URL)
  useEffect(() => {
    async function fetchActiveProjects() {
      try {
        const url = `${PROJECTS_URL}?action=list`;
        const res = await fetch(url);
        const data = await res.json();
        // Only include projects with status 'Active'
        const active = Array.isArray(data)
          ? data.filter((p: { status: string }) => p.status === 'Active').map((p: { name: string }) => p.name)
          : [];
        setActiveProjects(active);
      } catch (err) {
        setActiveProjects([]);
      }
    }
    fetchActiveProjects();
  }, []);
  // Load existing timesheets from Google Apps Script
  useEffect(() => {
    const spreadsheetId = ensureSpreadsheetId();
    if (!spreadsheetId) {
      console.warn('No spreadsheetId found in localStorage. Using default or prompting user.');
    }
    loadTimesheetData();
  }, [loadTimesheetData]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerRunning && !timerPaused) {
      timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [timerRunning, timerPaused]);

  // Timer to refresh running task heights in real-time
  useEffect(() => {
    let refreshTimer: NodeJS.Timeout;
    
    // Check if there are any running tasks
    const hasRunningTasks = Object.values(logs).some(dayLogs => 
      dayLogs.some(entry => !entry.end || entry.end === '')
    ) || timerRunning;
    
    if (hasRunningTasks) {
      refreshTimer = setInterval(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 30000); // Update every 30 seconds to keep heights current
    }
    
    return () => clearInterval(refreshTimer);
  }, [logs, timerRunning]);
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


  // Dynamic grid columns based on available days and filter
  useEffect(() => {
    let currentDays: string[];
    if (filterStartDate && allDates.length > 0) {
      // Show 7 days starting from filterStartDate, using allDates to check availability
      const startDate = new Date(filterStartDate);
      const filteredDates = [];
      const filteredDayLabels = [];
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const isoDate = currentDate.toISOString().split('T')[0];
        
        // Check if this date exists in our all available dates
        const dateIndex = allDates.indexOf(isoDate);
        if (dateIndex !== -1) {
          filteredDates.push(isoDate);
          // Convert back to display format
          const [yyyy, mm, dd] = isoDate.split('-');
          filteredDayLabels.push(`${dd}-${mm}-${yyyy}`);
        } else {
          // Include the date even if no data exists
          filteredDates.push(isoDate);
          const formattedDay = currentDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          filteredDayLabels.push(formattedDay);
        }
      }
      
      currentDays = filteredDayLabels;
    } else {
      // Use default last 7 days
      currentDays = days;
    }
    
    if (currentDays.length > 0) {
      const gridElement = document.querySelector(`.${styles.scheduleGrid}`) as HTMLElement;
      if (gridElement) {
        gridElement.style.gridTemplateColumns = `100px repeat(${currentDays.length}, 1fr)`;
      }
    }
  }, [days, filterStartDate, availableDates, allDates]);

  const submitToGoogleScript = async (data: Record<string, string>) => {
    console.log('Submitting to Google Apps Script:', data);
    
    // Add spreadsheetId to all requests
    const spreadsheetId = localStorage.getItem('spreadsheetId');
    console.log('SpreadsheetId being added to request:', spreadsheetId);
    
    const requestData = {
      ...data,
      spreadsheetId: spreadsheetId || ''
    };
    
    console.log('Complete request data with spreadsheetId:', requestData);
    
    try {
      // First try direct fetch
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData),
        mode: 'no-cors' // This prevents CORS errors but we won't get response data
      });
      
      console.log('Data submitted via fetch');
      return;
    } catch (error) {
      console.log('Fetch failed, using iframe fallback:', error);
    }
    
    // Fallback: Use iframe method but ensure it's properly contained
    try {
      // Create a completely hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.name = `hidden-form-target-${Date.now()}`;
      iframe.src = 'about:blank';
      
      // Add iframe to body
      document.body.appendChild(iframe);
      
      // Wait for iframe to be ready
      iframe.onload = () => {
        const form = document.createElement('form');
        form.action = SCRIPT_URL;
        form.method = 'POST';
        form.target = iframe.name;
        form.style.display = 'none';

        Object.entries(requestData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        console.log('Form submitted to Google Apps Script via iframe');
        
        // Clean up after submission
        setTimeout(() => {
          if (document.body.contains(form)) {
            document.body.removeChild(form);
          }
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      };
    } catch (error) {
      console.error('Error in submitToGoogleScript fallback:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!project || !task) return alert('Fill all fields');
    
    try {
      setLoading(true);
      const userEmail = localStorage.getItem('userEmail');
      const empId = localStorage.getItem('userId');
      const startTimeStr = new Date().toTimeString().slice(0, 8);
      
      // Validate we have required data
      if (!userEmail || !empId) {
        console.error('Missing user data:', { userEmail, empId });
        console.log('All localStorage data:', {
          userEmail: localStorage.getItem('userEmail'),
          userId: localStorage.getItem('userId'),
          userName: localStorage.getItem('userName'),
          userRole: localStorage.getItem('userRole')
        });
        alert('User session expired. Please log in again.');
        navigate('/');
        return;
      }
      
      console.log('Check-in data:', { userEmail, empId, project, task, startTimeStr });
      
      // Submit to Google Apps Script using form submission
      submitToGoogleScript({
        action: 'checkin',
        email: userEmail,
        empId: empId,
        project,
        task,
        start: startTimeStr
      });

      // Update local state optimistically
      setStartTime(new Date());
      setServerStartTime(startTimeStr);
      setTimerRunning(true);
      setTimerPaused(false);
      setElapsed(0);
      setPausedTime(0);
      setCurrentTask({ project, task, start: startTimeStr, end: null });
      setShowCheckIn(false);
      
      // Update local logs
      const today = new Date().toISOString().split('T')[0];
      const newEntry = { project, task, start: startTimeStr, end: null };
      setLogs(prev => ({
        ...prev,
        [today]: [...(prev[today] || []), newEntry]
      }));
      
      console.log('Check-in submitted to Google Script');
      
      // Reload timesheet data after a short delay to ensure backend is updated
      setTimeout(() => {
        loadTimesheetData();
      }, 1000);
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Error checking in');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!addEntryProject || !addEntryTask || !addEntryStartTime || !addEntryEndTime) {
      alert('Please fill all fields');
      return;
    }
    
    // Convert HH:MM to HH:MM:SS format for backend compatibility
    const startTimeFormatted = addEntryStartTime.includes(':') && addEntryStartTime.length === 5 
      ? addEntryStartTime + ':00' 
      : addEntryStartTime;
    const endTimeFormatted = addEntryEndTime.includes(':') && addEntryEndTime.length === 5 
      ? addEntryEndTime + ':00' 
      : addEntryEndTime;
    
    try {
      setLoading(true);
      const userEmail = localStorage.getItem('userEmail');
      const empId = localStorage.getItem('userId');
      
      if (!userEmail || !empId) {
        console.error('Missing user data:', { userEmail, empId });
        alert('User session expired. Please log in again.');
        navigate('/');
        return;
      }
      
      console.log('Adding completed entry:', { 
        userEmail, 
        empId, 
        project: addEntryProject, 
        task: addEntryTask, 
        start: startTimeFormatted, 
        end: endTimeFormatted 
      });
      
      // Submit completed entry to Google Apps Script
      submitToGoogleScript({
        action: 'addEntry',
        email: userEmail,
        empId: empId,
        project: addEntryProject,
        task: addEntryTask,
        start: startTimeFormatted,
        end: endTimeFormatted
      });

      // Update local logs optimistically
      const today = new Date().toISOString().split('T')[0];
      const newEntry = { 
        project: addEntryProject, 
        task: addEntryTask, 
        start: startTimeFormatted, 
        end: endTimeFormatted 
      };
      setLogs(prev => ({
        ...prev,
        [today]: [...(prev[today] || []), newEntry]
      }));
      
      // Reset form and close modal
      setAddEntryProject('');
      setAddEntryTask('');
      setAddEntryStartTime('');
      setAddEntryEndTime('');
      setShowAddEntry(false);
      
      console.log('Completed entry added to Google Script');
      
      // Reload timesheet data after a short delay
      setTimeout(() => {
        loadTimesheetData();
      }, 1000);
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Error adding entry');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!startTime || !currentTask) return;
    
    try {
      setLoading(true);
      const userEmail = localStorage.getItem('userEmail');
      const empId = localStorage.getItem('userId');
      const endTimeStr = new Date().toTimeString().slice(0, 8);
      
      // Validate we have required data
      if (!userEmail || !empId) {
        console.error('Missing user data for checkout:', { userEmail, empId });
        console.log('All localStorage data:', {
          userEmail: localStorage.getItem('userEmail'),
          userId: localStorage.getItem('userId'),
          userName: localStorage.getItem('userName'),
          userRole: localStorage.getItem('userRole')
        });
        alert('User session expired. Please log in again.');
        navigate('/');
        return;
      }
      
      console.log('Check-out data:', { userEmail, empId, endTimeStr });
      
      // Submit to Google Apps Script using form submission
      submitToGoogleScript({
        action: 'checkout',
        email: userEmail,
        empId: empId,
        end: endTimeStr
      });

      // Update local state optimistically
      setTimerRunning(false);
      setProject('');
      setTask('');
      setBreaks('');
      
      // Update local logs
      const today = new Date().toISOString().split('T')[0];
      setLogs(prev => ({
        ...prev,
        [today]: (prev[today] || []).map(entry => 
          entry.start === currentTask.start && !entry.end 
            ? { ...entry, end: endTimeStr }
            : entry
        )
      }));
      
      setCurrentTask(null);
      console.log('Check-out submitted to Google Script');
      
      // Reload timesheet data after a short delay to ensure backend is updated
      setTimeout(() => {
        loadTimesheetData();
      }, 1000);
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Error checking out');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = () => {
    if (timerRunning && !timerPaused) {
      setTimerPaused(true);
      setPausedTime(prev => prev + elapsed);
      console.log('Timer paused');
    } else if (timerPaused) {
      setTimerPaused(false);
      console.log('Timer resumed');
    }
  };

  const handleStop = async () => {
    if (!currentTask || !timerRunning) return;
    
    try {
      setLoading(true);
      const userEmail = localStorage.getItem('userEmail');
      const empId = localStorage.getItem('userId');
      const endTimeStr = new Date().toTimeString().slice(0, 8);
      
      if (!userEmail || !empId) {
        console.error('Missing user data for stop:', { userEmail, empId });
        alert('User session expired. Please log in again.');
        navigate('/');
        return;
      }
      
      console.log('Stop data:', { userEmail, empId, endTimeStr });
      
      // Submit stop to Google Apps Script
      submitToGoogleScript({
        action: 'checkout',
        email: userEmail,
        empId: empId,
        end: endTimeStr
      });

      // Reset all timer states
      setTimerRunning(false);
      setTimerPaused(false);
      setElapsed(0);
      setPausedTime(0);
      setProject('');
      setTask('');
      setBreaks('');
      setServerStartTime('');
      
      // Update local logs
      const today = new Date().toISOString().split('T')[0];
      setLogs(prev => ({
        ...prev,
        [today]: (prev[today] || []).map(entry => 
          entry.start === currentTask.start && !entry.end 
            ? { ...entry, end: endTimeStr }
            : entry
        )
      }));
      
      setCurrentTask(null);
      console.log('Task stopped and submitted to Google Script');
      
      // Reload timesheet data
      setTimeout(() => {
        loadTimesheetData();
      }, 1000);
    } catch (error) {
      console.error('Error stopping task:', error);
      alert('Error stopping task');
    } finally {
      setLoading(false);
    }
  };

  // Convert logs to display format
  const displayEntries = Object.entries(logs).flatMap(([date, entries]) =>
    entries.filter(entry => entry.end).map(entry => ({
      id: `${date}-${entry.start}`,
      date, // Keep ISO format (yyyy-mm-dd)
      project: entry.project,
      task: entry.task,
      startTime: entry.start.slice(0, 5),
      endTime: entry.end?.slice(0, 5) || '',
      workedSeconds: entry.end ? 
        (new Date(`2000-01-01 ${entry.end}`).getTime() - new Date(`2000-01-01 ${entry.start}`).getTime()) / 1000 : 0,
      breaks: 0
    }))
  );

  // Calculate daily totals for display
  const dailyTotals = Object.entries(logs).reduce((acc, [date, entries]) => {
    const totalSeconds = entries
      .reduce((sum, entry) => {
        if (entry.end && entry.end !== '' && entry.end !== null) {
          // Completed entry
          const start = new Date(`2000-01-01 ${entry.start}`).getTime();
          const end = new Date(`2000-01-01 ${entry.end}`).getTime();
          return sum + (end - start) / 1000;
        } else {
          // Running entry - calculate time from start to now
          const start = new Date(`2000-01-01 ${entry.start}`).getTime();
          const now = new Date();
          const currentTime = new Date(`2000-01-01 ${now.toTimeString().slice(0, 8)}`).getTime();
          return sum + (currentTime - start) / 1000;
        }
      }, 0);
    acc[date] = totalSeconds / 3600; // Convert to hours
    return acc;
  }, {} as Record<string, number>);

  // Debug daily totals
  console.log('Daily totals calculated:', dailyTotals);
  console.log('Available dates (last 7 days):', availableDates);
  console.log('All dates (for filtering):', allDates);
  console.log('Days:', days);
  console.log('Logs:', logs);
  console.log('Filter start date:', filterStartDate);

  // Filter data based on selected start date (7-day range)
  const getFilteredData = () => {
    if (!filterStartDate) {
      console.log('No filter start date, showing default last 7 days from backend');
      return { 
        filteredDays: days, 
        filteredAvailableDates: availableDates, 
        filteredLogs: logs,
        filteredDailyTotals: dailyTotals
      };
    }
    
    // Generate 7 days starting from filterStartDate
    const startDate = new Date(filterStartDate);
    const filteredDates = [];
    const filteredDayLabels = [];
    const filteredLogs: DailyLogs = {};
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const isoDate = currentDate.toISOString().split('T')[0];
      
      // Always include the date in the filtered range
      filteredDates.push(isoDate);
      
      // Create a consistent day label format
      const [yyyy, mm, dd] = isoDate.split('-');
      const dayLabel = `${dd}-${mm}-${yyyy}`;
      filteredDayLabels.push(dayLabel);
      
      // Include logs for this date if they exist in the logs object
      if (logs[isoDate] && Array.isArray(logs[isoDate])) {
        filteredLogs[isoDate] = logs[isoDate];
        console.log(`Added logs for ${isoDate}:`, logs[isoDate]);
      } else {
        // Even if no logs exist for this date, include it with empty array
        filteredLogs[isoDate] = [];
        console.log(`No logs found for ${isoDate}, added empty array`);
      }
    }
    
    // Calculate daily totals for filtered logs
    const filteredDailyTotals = Object.entries(filteredLogs).reduce((acc, [date, entries]) => {
      const totalSeconds = entries
        .reduce((sum, entry) => {
          if (entry.end && entry.end !== '' && entry.end !== null) {
            // Completed entry
            const start = new Date(`2000-01-01 ${entry.start}`).getTime();
            const end = new Date(`2000-01-01 ${entry.end}`).getTime();
            return sum + (end - start) / 1000;
          } else {
            // Running entry - calculate time from start to now
            const start = new Date(`2000-01-01 ${entry.start}`).getTime();
            const now = new Date();
            const currentTime = new Date(`2000-01-01 ${now.toTimeString().slice(0, 8)}`).getTime();
            return sum + (currentTime - start) / 1000;
          }
        }, 0);
      acc[date] = totalSeconds / 3600; // Convert to hours
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Filtered 7-day data:', { 
      filteredDayLabels, 
      filteredDates, 
      filteredLogs,
      filteredDailyTotals,
      startDate: filterStartDate 
    });
    
    return { 
      filteredDays: filteredDayLabels, 
      filteredAvailableDates: filteredDates, 
      filteredLogs,
      filteredDailyTotals
    };
  };

  const { filteredDays, filteredAvailableDates, filteredLogs, filteredDailyTotals } = getFilteredData();

  console.log('Final filtered data being used:', { filteredDays, filteredAvailableDates, filteredLogs });

  // Function to toggle entry expansion
  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
      {/* Loading Overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingMainText}>Loading Timesheet</div>
          <div className={styles.loadingSubtext}>
            Fetching your timesheet data and checking for running tasks...
          </div>
        </div>
      )}
      
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
  <div className="flex items-center gap-3">
    <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
    <div>
      <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
      <p className="text-base font-semibold text-gray-600">Timesheet</p>
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


    {/* Profile Dropdown (Click-based) */}
    <div className="relative" ref={profileRef}>
      <button
        onClick={() => setIsProfileOpen(prev => !prev)}
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
      onClick={() => navigate('/dashboard')}
      className="text-green-700 hover:bg-green-100 p-2 rounded-full transition"
    >
      <Home className="h-5 w-5" />
    </button>
  </div>
</header>



      <main className={`max-w-[95%] mx-auto py-4 px-4 ${(showCheckIn || showAddEntry) ? 'blur-sm pointer-events-none select-none' : ''}`}>
        <div className="flex flex-col gap-4">
          {/* Checkin - Top Section */}
          <Card className={`shadow-md border bg-white ${styles.runningTaskCard} flex flex-col flex-shrink-0`}>
            <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
              <CardTitle>Check-In</CardTitle>
              <div className="flex items-center gap-2">
                {!timerRunning && (
                  <Button
                    onClick={() => setShowCheckIn(true)}
                    size="sm"
                    className="bg-blue-600 text-white p-2"
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className={styles.checkinContent}>
              {timerRunning && currentTask ? (
                <div className={styles.checkinHorizontalBlock}>
                  <div className={styles.checkinInfoSection}>
                    <div className={styles.checkinField}>
                      <span className={styles.checkinLabel}>Project</span>
                      <div className={styles.checkinValue}>{currentTask.project}</div>
                    </div>
                    <div className={styles.checkinField}>
                      <span className={styles.checkinLabel}>Task</span>
                      <div className={`${styles.checkinValue} ${styles.taskValue}`}>
                        {currentTask.task}
                      </div>
                    </div>
                  </div>
                  <div className={styles.checkinElapsedSection}>
                    <span className={styles.checkinLabel}>Elapsed Time</span>
                    <div className={styles.checkinElapsedTime}>
                      {formatTime(calculateServerElapsed(serverStartTime) - pausedTime)}
                    </div>
                    {timerPaused && <div className={styles.checkinPausedText}>(Paused)</div>}
                  </div>
                  <div className={styles.checkinActions}>
                    <Button
                      onClick={handleStop}
                      size="sm"
                      className="bg-red-600 text-white hover:bg-red-700"
                      disabled={loading}
                    >
                      Check Out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={styles.checkinEmpty}>
                  No task running - Click + to start a new task
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Schedule - Bottom Section */}
          <Card className={`shadow-lg border border-gray-200 bg-white ${styles.weeklyScheduleCard} flex flex-col`}>
            <CardHeader className="bg-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Schedule</CardTitle>
                  <div className="text-sm text-gray-600">9 A.M to 6 P.M timesheet data</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="date-filter" className="text-sm font-medium">Filter by Date:</Label>
                    <Input
                      id="date-filter"
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-48"
                      placeholder="Select start date"
                    />
                  </div>
                  <Button 
                    onClick={() => setShowAddEntry(true)}
                    className="bg-green-600 text-white flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Entry
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className={`p-4 ${styles.scheduleContainer}`}>
              {loading ? (
                <div className={styles.cardLoading}>
                  <div className={styles.cardLoadingSpinner}></div>
                  <div className={styles.cardLoadingText}>Loading schedule data...</div>
                </div>
              ) : filteredDays.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">No timesheet data available</p>
                    <p className="text-sm">Please check your connection or try refreshing the page</p>
                  </div>
                </div>
              ) : (
                <div className={styles.scheduleGrid}>
                  {/* Header row */}
                  <div className={`${styles.scheduleCell} ${styles.dayHeaderCell}`}>Time</div>
                  {filteredDays.map((day, index) => {
                    // Get the corresponding ISO date from filteredAvailableDates for lookup
                    const isoDate = filteredAvailableDates[index] || '';
                    const dayTotal = filteredDailyTotals[isoDate] || 0;
                    
                    // Get day of week from ISO date
                    const dayOfWeek = isoDate ? new Date(isoDate).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() : '';
                      
                      return (
                        <div key={day} className={`${styles.scheduleCell} ${styles.dayHeaderCell}`}>
                          <div className="font-semibold">{day}</div>
                          <div className="text-xs text-blue-600 font-medium">{dayOfWeek}</div>
                          <div className="text-xs text-gray-600 mt-1 font-medium">
                            {dayTotal > 0 ? `${dayTotal.toFixed(1)} hours` : '0 hours'}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Time slot rows */}
                    {timeSlots.map(slot => (
                      <React.Fragment key={slot}>
                        <div className={`${styles.scheduleCell} ${styles.timeSlotCell}`}>{slot}</div>
                        {filteredDays.map(day => (
                          <div key={day + slot} className={`${styles.scheduleCell} ${styles.dayCell}`}>
                            {/* Empty cell for time slot entries */}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                    
                    {/* Floating timesheet entries */}
                    {Object.entries(filteredLogs).flatMap(([date, entries]: [string, TimesheetEntry[]]) => 
                      entries.map((entry, i) => {
                        // Handle both completed and running entries
                        const hasEnd = entry.end && entry.end !== null && entry.end !== '';
                        const isRunning = !hasEnd;
                        
                        const entryData = {
                          id: `${date}-${entry.start}-${i}`,
                          date,
                          project: entry.project,
                          task: entry.task,
                          startTime: entry.start.slice(0, 5),
                          endTime: hasEnd ? entry.end?.slice(0, 5) || '' : new Date().toTimeString().slice(0, 5),
                          isRunning
                        };
                        
                        // Find column position
                        const col = filteredAvailableDates.indexOf(entryData.date);
                        if (col < 0) return null;
                        
                        // Calculate positioning
                        const topOffset = getTopOffset(entryData.startTime);
                        const entryHeight = isRunning 
                          ? getRunningHeight(entryData.startTime) 
                          : getHeight(entryData.startTime, entryData.endTime);
                        
                        // Column positioning
                        const columnWidth = `calc((100% - 100px) / ${filteredDays.length})`;
                        const leftPosition = `calc(100px + ${col} * ${columnWidth} + 4px)`;
                        const entryWidth = `calc(${columnWidth} - 8px)`;
                        
                        const isCurrentTask = timerRunning && currentTask?.project === entryData.project && currentTask?.start === entryData.startTime + ':00';
                        const isExpanded = expandedEntries.has(entryData.id);
                        const shouldShowToggle = entryHeight < 50; // Show dropdown for small entries
                        
                        return (
                          <div
                            key={entryData.id}
                            className={`${styles.timesheetEntryFloat} ${(isCurrentTask || entryData.isRunning) ? styles.running : ''} ${isExpanded ? styles.expanded : ''}`}
                            style={{
                              top: `${topOffset}px`,
                              height: `${entryHeight}px`,
                              left: leftPosition,
                              width: entryWidth,
                              backgroundColor: (isCurrentTask || entryData.isRunning) ? '#dc2626' : getProjectColor(entryData.project)
                            }}
                            onClick={(e) => {
                              if (shouldShowToggle) {
                                e.stopPropagation();
                                toggleEntryExpansion(entryData.id);
                              }
                            }}
                          >
                            {shouldShowToggle && !isExpanded ? (
                              // Small block - show only project name
                              <>
                                <div className={styles.entryProject}>
                                  {entryData.project}
                                </div>
                                <div className={styles.entryToggle}>
                                  <ChevronDown />
                                </div>
                              </>
                            ) : (
                              // Normal or expanded - show all details
                              <>
                                <div className={`${styles.entryProject} ${isExpanded ? styles.expanded : ''}`}>
                                  {entryData.project}
                                </div>
                                <div className={`${styles.entryTask} ${isExpanded ? styles.expanded : ''}`}>
                                  {entryData.task}
                                </div>
                                <div className={styles.entryTime}>
                                  {entryData.startTime} - {entryData.isRunning ? 'Running' : entryData.endTime}
                                </div>
                                {shouldShowToggle && (
                                  <div 
                                    className={`${styles.entryToggle} ${isExpanded ? styles.expanded : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleEntryExpansion(entryData.id);
                                    }}
                                  >
                                    <ChevronDown />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      }).filter(Boolean)
                    )}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </main>

      {showAddEntry && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <Card className="w-[400px] shadow-xl border border-green-300 bg-white z-50">
            <CardHeader><CardTitle>Add Completed Entry</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Project</Label>
                <Select value={addEntryProject} onValueChange={setAddEntryProject}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {activeProjects.length > 0 ? (
                      activeProjects.map((proj) => (
                        <SelectItem key={proj} value={proj}>{proj}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>No active projects available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Task Description</Label>
                <Textarea value={addEntryTask} onChange={(e) => setAddEntryTask(e.target.value)} placeholder="Describe your work..." 
                  className="mt-1"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Start Time</Label>
                  <Input 
                    type="time" 
                    value={addEntryStartTime} 
                    onChange={(e) => setAddEntryStartTime(e.target.value)} 
                  />
                </div>
                <div>
                  <Label className="mb-2 block">End Time</Label>
                  <Input 
                    type="time" 
                    value={addEntryEndTime} 
                    onChange={(e) => setAddEntryEndTime(e.target.value)} 
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddEntry} 
                  className="flex-1 bg-green-600 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Entry'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddEntry(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showCheckIn && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <Card className="w-[400px] shadow-xl border border-green-300 bg-white z-50">
            <CardHeader><CardTitle>Project Check-in</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Project </Label>
                <Select value={project} onValueChange={setProject} >
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {activeProjects.length > 0 ? (
                      activeProjects
                        .filter((proj) => typeof proj === 'string' && proj.trim() !== '')
                        .map((proj) => (
                          <SelectItem key={proj} value={proj}>{proj}</SelectItem>
                        ))
                    ) : (
                      <SelectItem value="no-projects" disabled>No active projects available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Task Description</Label>
                <Textarea value={task} onChange={(e) => setTask(e.target.value)} placeholder="Describe your work..."
                className="mt-1" />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCheckIn} 
                  className="flex-1 bg-green-600 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    'Start Task'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCheckIn(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}