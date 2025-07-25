import React, { useEffect, useState, useRef } from 'react';  // added useRef
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ArrowLeft, Bell, Home, User, UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwiM7SKXbTc0EYAqDqUjRrwzJq8c2_8gYVd_tOi85TV1TRlqSxYI7x91YG4gHt65d5HWw/exec'; // Update this with your new deployment URL if it changes

// Function to get sheet ID from localStorage
  // Helper function to format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSheetId = () => {
  try {
    return localStorage.getItem('spreadsheetId') || '';
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return '';
  }
};

type LeaveEntry = {
  timestamp: string;
  leaveType?: string;
  leavetype?: string; // Backend returns lowercase keys
  fromDate?: string;
  fromdate?: string; // Backend returns lowercase keys
  toDate?: string;
  todate?: string; // Backend returns lowercase keys
  reason: string;
  dayType?: string;
  daytype?: string; // Backend returns lowercase keys
  status: string;
};

const initialBalance = {
  sick: { name: 'Sick Leave', total: 0, used: 0 },
  casual: { name: 'Casual Leave', total: 0, used: 0 },
  annual: { name: 'Earned Leave', total: 0, used: 0 },
  compensation: { name: 'Compensation Leave', total: 0, used: 0 },
};

const publicHolidays = [
  { date: '2025-08-15', name: 'Independence Day' },
  { date: '2025-10-02', name: 'Gandhi Jayanti' },
  { date: '2025-12-25', name: 'Christmas' },
];

const LeaveManagement = () => {
  const navigate = useNavigate();

  // State for form
  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [stepTwo, setStepTwo] = useState(false);
  const [dayType, setDayType] = useState<'Half Day' | 'Full Day' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data state
  const [history, setHistory] = useState<LeaveEntry[]>([]);
  const [balance, setBalance] = useState(initialBalance);

  // Profile dropdown state + ref for outside click detection
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Function to check and apply automatic leave updates
  const checkAndApplyLeaveUpdates = async () => {
    const sheetId = getSheetId();
    if (!sheetId) return;

    try {
      const callbackName = 'leaveUpdateCallback_' + Date.now();
      const url = `${WEB_APP_URL}?sheetId=${sheetId}&action=checkLeaveUpdates&callback=${callbackName}`;
      
      const updateData = await new Promise((resolve, reject) => {
        (window as any)[callbackName] = (data: any) => {
          delete (window as any)[callbackName];
          resolve(data);
        };

        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => {
          delete (window as any)[callbackName];
          reject(new Error('Failed to check leave updates'));
        };
        document.body.appendChild(script);
        
        setTimeout(() => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        }, 5000);
      });

      if ((updateData as any)?.updated) {
        console.log('Leave balances updated automatically:', updateData);
      }
    } catch (error) {
      console.error('Error checking leave updates:', error);
    }
  };

  // Function to trigger balance sync
  const syncBalance = async () => {
    const sheetId = getSheetId();
    console.log('Attempting to sync balance with sheetId:', sheetId);
    
    if (!sheetId) {
      console.log('No sheet ID found for sync');
      return;
    }

    try {
      const callbackName = 'syncCallback_' + Date.now();
      const url = `${WEB_APP_URL}?sheetId=${sheetId}&action=syncBalance&callback=${callbackName}`;
      console.log('Sync URL:', url);
      
      // Create a promise that resolves when the callback is called
      const syncData = await new Promise((resolve, reject) => {
        // Set up the callback function
        (window as any)[callbackName] = (data: any) => {
          delete (window as any)[callbackName];
          console.log('Sync response received:', data);
          if (data.success) {
            console.log('Balance synced successfully:', data);
            resolve(data);
          } else {
            console.log('Balance sync had issues but continuing:', data);
            // Still resolve with data if we have leaveBalance, even if sync failed
            if (data.leaveBalance) {
              console.log('Using available balance data despite sync issues');
              resolve(data);
            } else {
              console.error('Balance sync failed:', data);
              reject(new Error(data.error || 'Sync failed'));
            }
          }
        };

        // Create and insert the script tag
        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => {
          delete (window as any)[callbackName];
          console.error('Failed to load sync script');
          reject(new Error('Failed to load sync script'));
        };
        document.body.appendChild(script);
        
        // Clean up the script tag after use
        setTimeout(() => {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        }, 5000);
      });

      // Update the balance state with synced data
      if (syncData && (syncData as any).leaveBalance) {
        const syncedBalance = (syncData as any).leaveBalance;
        
        // Debug: log all available columns
        console.log('All available balance columns:', Object.keys(syncedBalance));
        console.log('Full synced balance data:', syncedBalance);
        
        // Map the synced balance data to our state structure
        // Handle multiple possible column naming patterns
        const getUsedValue = (leaveType: string) => {
          // Try different possible column names for "used" values
          const possibleUsedColumns = [
            `${leaveType} Used`,           // Standard format: "Casual Used"
            `${leaveType.toUpperCase()}T`, // T format: "CASUALT" 
            `${leaveType.charAt(0).toUpperCase()}${leaveType.slice(1).toLowerCase()}T`, // Mixed case T: "CasualT"
            `${leaveType.charAt(0).toUpperCase()}T`, // Short T: "CT"
            `${leaveType.charAt(0).toUpperCase()}${leaveType.slice(1, 2).toLowerCase()}T`, // Medium T: "CaT"
            // Handle the specific cases we see in logs
            leaveType === 'Casual' ? 'CsT' : null,
            leaveType === 'Sick' ? 'ST' : null, 
            leaveType === 'Earned' ? 'ET' : null,
            leaveType === 'Compensation' ? 'CT' : null,
          ].filter(Boolean);

          for (const columnName of possibleUsedColumns) {
            if (syncedBalance[columnName] !== undefined) {
              console.log(`Found used value for ${leaveType}: ${syncedBalance[columnName]} in column "${columnName}"`);
              return syncedBalance[columnName] || 0;
            }
          }
          
          console.log(`No used column found for ${leaveType}, defaulting to 0`);
          return 0;
        };

        const updatedBalance = {
          sick: { 
            name: 'Sick Leave', 
            total: syncedBalance["Sick"] || 0, 
            used: getUsedValue("Sick")
          },
          casual: { 
            name: 'Casual Leave', 
            total: syncedBalance["Casual"] || 0, 
            used: getUsedValue("Casual")
          },
          annual: { 
            name: 'Earned Leave', 
            total: syncedBalance["Earned"] || 0, 
            used: getUsedValue("Earned")
          },
          compensation: { 
            name: 'Compensation Leave', 
            total: syncedBalance["Compensation"] || 0, 
            used: getUsedValue("Compensation")
          },
        };

        console.log('Updating balance state with synced data:', updatedBalance);
        setBalance(updatedBalance);
      }

    } catch (error) {
      console.error('Error syncing balance:', error);
    }
  };

  const fetchHistory = async () => {
    const sheetId = getSheetId();
    if (!sheetId) {
      console.error('No sheet ID found in localStorage');
      return;
    }

    try {
      // Use JSONP to avoid CORS issues
      const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      
      const data = await new Promise((resolve, reject) => {
        // Create callback function
        (window as any)[callbackName] = (data: any) => {
          resolve(data);
          // Cleanup
          delete (window as any)[callbackName];
          document.head.removeChild(script);
        };

        // Create script tag
        const script = document.createElement('script');
        script.src = `${WEB_APP_URL}?sheetId=${sheetId}&callback=${callbackName}`;
        script.onerror = () => {
          reject(new Error('JSONP request failed'));
          delete (window as any)[callbackName];
          document.head.removeChild(script);
        };
        
        document.head.appendChild(script);
      });
      
      if ((data as any)?.error) {
        console.error('Backend error:', (data as any).error);
        return;
      }

      const { leaveHistory, leaveBalance } = data as any;

      // Update balance based on new backend format with dynamic used calculation
      const updatedBalance = {
        sick: { 
          name: 'Sick Leave', 
          total: leaveBalance["Sick"] || 0, 
          used: leaveBalance["Sick Used"] || 0 
        },
        casual: { 
          name: 'Casual Leave', 
          total: leaveBalance["Casual"] || 0, 
          used: leaveBalance["Casual Used"] || 0 
        },
        annual: { 
          name: 'Earned Leave', 
          total: leaveBalance["Earned"] || 0, 
          used: leaveBalance["Earned Used"] || 0 
        },
        compensation: { 
          name: 'Compensation Leave', 
          total: leaveBalance["Compensation"] || 0, 
          used: leaveBalance["Compensation Used"] || 0 
        },
      };

      setBalance(updatedBalance);
      setHistory(leaveHistory || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      // First check and apply any automatic leave updates (monthly/yearly)
      await checkAndApplyLeaveUpdates();
      // Then sync the balance to ensure accuracy
      await syncBalance();
      // Finally fetch the updated history
      await fetchHistory();
    };
    
    initializePage();
  }, []);

 const selectedBalance = leaveType === 'unpaid'
  ? { total: Infinity, used: 0 }
  : balance[leaveType as keyof typeof balance] || { total: 0, used: 0 };

  
  // Calculate requested days with proper handling for half-day vs full-day
  const calculateRequestedDays = () => {
    if (!fromDate || !toDate) return 0;
    
    // Calculate base days (inclusive)
    const baseDays = Math.floor((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // For half day, return half of the calculated days
    if (dayType === 'Half Day') {
      return baseDays / 2;
    }
    
    // For full day, return the calculated days
    return baseDays;
  };
  
  const requestedDays = calculateRequestedDays();
  const overLimit = leaveType !== 'unpaid' && requestedDays > (selectedBalance.total - selectedBalance.used);

  const handleInitialSubmit = async () => {
    if (!leaveType || !fromDate || !toDate || !reason) {
      alert('⚠️ Please fill all fields');
      return;
    }

    // Check if user has exceeded limit before proceeding
    if (overLimit) {
      alert('❌ Insufficient leave balance. Please check your remaining days.');
      return;
    }

    setStepTwo(true);
  };

  const handleFinalSubmit = async () => {
    const sheetId = getSheetId();
    if (!sheetId) {
      alert('❌ No sheet ID found. Please ensure you are logged in properly.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert leave type key to readable format for backend
      const leaveTypeMapping = {
        'sick': 'Sick',
        'casual': 'Casual',
        'annual': 'Earned',
        'compensation': 'Compensation',
        'unpaid': 'Leave Without Pay', // 👈 Add this
      };

      
      const mappedLeaveType = leaveTypeMapping[leaveType as keyof typeof leaveTypeMapping] || leaveType;
      
      // Use hidden iframe for POST to avoid CORS
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.name = 'hidden-iframe';
      document.body.appendChild(iframe);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${WEB_APP_URL}?sheetId=${sheetId}`;
      form.target = 'hidden-iframe';
      form.style.display = 'none';

      // Add form data with proper leave type mapping
      const formData = {
        leaveType: mappedLeaveType,
        fromDate,
        toDate,
        reason,
        dayType
      };

      Object.entries(formData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      
      // Add success handler for iframe
      iframe.onload = () => {
        try {
          // Clean up
          setTimeout(() => {
            if (document.body.contains(form)) document.body.removeChild(form);
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
          }, 1000);
          
          // Show success message
          alert('✅ Leave request submitted successfully!');
          
          // Reset form
          setLeaveType('');
          setFromDate('');
          setToDate('');
          setReason('');
          setDayType('');
          setStepTwo(false);
          setIsSubmitting(false);
          
          // Refresh data to show new request
          fetchHistory();
        } catch (cleanupError) {
          console.log('Cleanup completed');
          setIsSubmitting(false);
        }
      };
      
      form.submit();

    } catch (err) {
      console.error('Submit error:', err);
      alert('❌ Failed to submit: ' + (err as Error).message);
      setIsSubmitting(false);
    }
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';
    const dateStr = date.toISOString().split('T')[0];

    // Public holidays get a darker green
    if (publicHolidays.some(h => h.date === dateStr)) return 'bg-green-900 text-white';

    // Check for approved leaves - show all approved leaves in light green
    for (const entry of history) {
      // Only show approved leaves on calendar
      const status = entry.status?.toLowerCase();
      if (status !== 'approved') continue;
      
      const type = (entry.leavetype || entry.leaveType)?.toLowerCase?.();
      if (!type) continue;
      
      const leaveDates = [];
      let d = new Date(entry.fromdate || entry.fromDate || '');
      const end = new Date(entry.todate || entry.toDate || '');
      while (d <= end) {
        leaveDates.push(new Date(d).toISOString().split('T')[0]);
        d.setDate(d.getDate() + 1);
      }
      
      // If this date is part of an approved leave, show it in light green
      if (leaveDates.includes(dateStr)) {
        return 'bg-green-100 text-green-800';
      }
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Leave Request</p>
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


          {/* Profile dropdown with click toggle */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(prev => !prev)}
              className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full"
              aria-haspopup="true"
              aria-expanded={showProfileMenu}
              aria-label="User profile menu"
            >
              <User className="w-5 h-5 text-green-700" />
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg z-50">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/profile');
                  }}
                  className="w-full px-4 py-2 text-left text-gray-800 hover:bg-green-50 flex items-center gap-2"
                >
                  <UserCircle className="w-4 h-4 text-green-600" /> View Profile
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="text-green-700 hover:bg-green-100 p-2 rounded-full transition"
            aria-label="Dashboard"
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Leave Summary */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(balance).map(([key, b]) => {
          const remaining = b.total - b.used;
          const usedPercent = (b.used / b.total) * 100;
          return (
            <Card key={key} className="bg-white shadow-lg rounded-xl">
              <CardContent className="p-5">
                <h2 className="text-lg font-semibold text-black mb-3">{b.name}</h2>
                <div className="relative w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Used: {b.used}</span>
                  <span className="text-red-600">Remaining: {remaining}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>


      {/* Form + Calendar */}
      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="shadow-md">
          <CardHeader><CardTitle>Apply for Leave</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger><SelectValue placeholder="Choose leave type" /></SelectTrigger>
              <SelectContent>
                <>
                {Object.entries(balance).map(([key, b]) => (
                  <SelectItem key={key} value={key}>{b.name}</SelectItem>
                ))}
                <SelectItem value="unpaid">Leave Without Pay</SelectItem>
              </>

              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                type="date" 
                value={fromDate} 
                onChange={(e) => {
                  const selectedFromDate = e.target.value;
                  setFromDate(selectedFromDate);
                  
                  // Auto-set toDate to the next day if fromDate is selected and toDate is empty or before fromDate
                  if (selectedFromDate) {
                    const nextDay = new Date(selectedFromDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    const nextDayStr = nextDay.toISOString().split('T')[0];
                    
                    // Only auto-set if toDate is empty or if toDate is before the new fromDate
                    if (!toDate || toDate < selectedFromDate) {
                      setToDate(nextDayStr);
                    }
                  }
                }} 
              />
              <Input 
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate || undefined} // Ensure toDate can't be before fromDate
              />
            </div>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for leave..." />
            
            {/* Show calculated days and balance check */}
            {leaveType && fromDate && toDate && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Leave Days Requested:</span>
                  <span className="font-semibold">
                    {dayType === 'Half Day' ? `${requestedDays} days` : `${requestedDays} day${requestedDays !== 1 ? 's' : ''}`}
                  </span>
                </div>
                {overLimit && (
                  <div className="text-red-600 text-xs font-medium">
                    ⚠️ Insufficient balance. You need {requestedDays - (selectedBalance.total - selectedBalance.used)} more days.
                  </div>
                )}
              </div>
            )}
            
            {!stepTwo ? (
              <Button 
                className="w-full bg-green-600 text-white" 
                onClick={handleInitialSubmit} 
                disabled={overLimit || isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Submit Leave Request'}
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-semibold">Select Day Type:</p>
                <div className="flex gap-4">
                  <Button 
                    variant={dayType === 'Full Day' ? 'default' : 'outline'} 
                    onClick={() => setDayType('Full Day')}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Full Day
                    <span className="ml-2 text-xs opacity-75">
                      ({fromDate && toDate ? Math.floor((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0} days)
                    </span>
                  </Button>
                  <Button 
                    variant={dayType === 'Half Day' ? 'default' : 'outline'} 
                    onClick={() => setDayType('Half Day')}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Half Day
                    <span className="ml-2 text-xs opacity-75">
                      ({fromDate && toDate ? (Math.floor((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) / 2 : 0} days)
                    </span>
                  </Button>
                </div>
                {dayType && (
                  <div className="flex gap-4 mt-4">
                    <Button 
                      className="bg-green-600 text-white w-full" 
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Final Submit'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => { setStepTwo(false); setDayType(''); }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
            {overLimit && <p className="text-red-600 text-sm">Exceeded leave balance.</p>}
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="shadow-md">
          <CardHeader><CardTitle>Leave Calendar</CardTitle></CardHeader>
          <CardContent>
            <Calendar tileClassName={tileClassName} className="rounded-xl w-full" />
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-3 text-black">Public Holidays</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {publicHolidays.map((holiday, idx) => (
                  <div key={idx} className="bg-green-100 border border-green-600 text-green-800 p-3 rounded-lg shadow-sm">
                    <p className="font-semibold">{holiday.name}</p>
                    <p className="text-sm">{new Date(holiday.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card>
          <CardHeader><CardTitle>Leave History</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm text-left">
              <thead>
                <tr className="bg-slate-100 text-gray-700">
                  <th className="p-3">Type</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? history.map((leave, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 capitalize">{leave.leavetype || leave.leaveType}</td>
                    <td className="p-3">{formatDate(leave.fromdate || leave.fromDate)}</td>
                    <td className="p-3">{formatDate(leave.todate || leave.toDate)}</td>
                    <td className="p-3">{leave.reason}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (leave.status === 'Approved') ? 'bg-green-100 text-green-700' :
                        (leave.status === 'Rejected') ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {leave.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="p-4 text-center text-gray-400">No leave history found.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaveManagement;
