import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Home, Bell, User, UserCircle, Pencil, Trash2 } from 'lucide-react';
import RequireLogin from '@/components/ui/RequireLogin';

const AdminLeaveManager = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [holidays, setHolidays] = useState([]);
  const [compLeaves, setCompLeaves] = useState([]);
  const [compForm, setCompForm] = useState({ empId: '', leaves: '' });
  const [holidayForm, setHolidayForm] = useState({
    title: '',
    fromDate: '',
    toDate: '',
    category: '',
    editIndex: null,
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [isLoadingLeaveRequests, setIsLoadingLeaveRequests] = useState(false);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [isLoadingLeaveHistory, setIsLoadingLeaveHistory] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);

  const SHEETS_API =
    'https://script.google.com/macros/s/AKfycbzjcXK9olWAHt1y9LCR4h63q9TzRttOHStTCq9wVAbwRSJWyfRpib1Wa-gnayKaMZIG/exec';

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClickOutside = (event: MouseEvent) => {
    if (profileRef.current && !(profileRef.current as any).contains(event.target)) {
      setIsProfileOpen(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchHolidays();
    fetchLeaveHistory();
  }, []);

  const fetchLeaveRequests = () => {
    setIsLoadingLeaveRequests(true);
    fetch(`${SHEETS_API}?action=getAdminLeaveRequests`)
      .then((res) => res.text())
      .then((text) => {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setLeaveRequests(parsed);
          } else {
            console.warn('Unexpected format from Sheets:', parsed);
          }
        } catch (err) {
          console.error('Invalid JSON from Apps Script:', text);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch leave requests', err);
      })
      .finally(() => setIsLoadingLeaveRequests(false));
  };

  const fetchHolidays = () => {
    setIsLoadingHolidays(true);
    fetch(`${SHEETS_API}?action=getHolidays`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHolidays(data.map((h: any) => ({
            title: h.title || h.Title,
            date: h.date || h.Date,
            category: h.category || h.Category,
          })));
        }
      })
      .catch(err => console.error('Error fetching holidays:', err))
      .finally(() => setIsLoadingHolidays(false));
  };

  const fetchLeaveHistory = () => {
    setIsLoadingLeaveHistory(true);
    fetch(`${SHEETS_API}?action=getAdminLeaveHistory`)
      .then(res => res.text())
      .then(text => {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) setLeaveHistory(parsed);
        } catch {}
      })
      .finally(() => setIsLoadingLeaveHistory(false));
  };

  const handleLeaveAction = async (req: any, status: string) => {
    const payload = {
      action: 'updateLeaveStatus',
      SHEETID: req.SHEETID,
      timestamp: req.Timestamp,
      status,
      EMP_ID: req.EmpId,
      EMP_NAME: req.EMP_NAME,
      EMP_LAST_NAME: req.EMP_LAST_NAME,
      EMAIL: req.EMAIL,
      LeaveType: req.LeaveType,
      FromDate: req.FromDate,
      ToDate: req.ToDate,
      Reason: req.Reason,
    };

    try {
      const response = await fetch(`${SHEETS_API}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON: ' + text);
      }

      if (response.ok && data.message?.toLowerCase().includes('success')) {
        alert('Leave status updated!');
        setLeaveRequests(prev => prev.filter(lr => lr.Timestamp !== req.Timestamp || lr.SHEETID !== req.SHEETID));
      } else {
        alert('Update failed: ' + text);
      }
    } catch (err: any) {
      console.error('Fetch exception:', err);
      alert('An error occurred while updating leave status: ' + err.message);
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const isHoliday = holidays.some((h) => {
        const holidayDate = formatDate(h.date);
        return holidayDate === dateStr;
      });
      
      if (isHoliday) {
        return 'bg-green-200 text-green-800 font-semibold rounded-full';
      }
    }
    return '';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    if (dateStr.includes('T')) {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return dateStr;
  };

  const handleAddOrUpdateHoliday = async () => {
    const { title, fromDate } = holidayForm;
    if (title && fromDate) {
      try {
        const formattedDate = formatDate(holidayForm.fromDate);
        const response = await fetch(SHEETS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'addHoliday',
            title: holidayForm.title,
            date: formattedDate,
          }),
        });
        
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch {}
        if (data && data.message === 'Success') {
          fetchHolidays();
          setHolidayForm({ title: '', fromDate: '', toDate: '', category: '', editIndex: null });
          alert('Holiday added successfully!');
        } else {
          alert('Failed to add holiday: ' + (data?.message || text));
        }
      } catch (err) {
        alert('Failed to add holiday');
      }
    } else {
      alert('Please fill all fields');
    }
  };

  const handleEditHoliday = (index: number) => {
    const h = holidays[index];
    setHolidayForm({ title: h.title, fromDate: h.date, toDate: h.date, category: h.category, editIndex: index });
  };

  const handleDeleteHoliday = async (date: string) => {
    try {
      const holidayToDelete = holidays.find(h => formatDate(h.date) === formatDate(date));
      
      if (!holidayToDelete) {
        throw new Error('Holiday not found in the current list');
      }

      const payload = {
        action: 'deleteHoliday',
        date: holidayToDelete.date,
        title: holidayToDelete.title,
      };

      const response = await fetch(SHEETS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        if (text.toLowerCase().includes('success')) {
          result = { status: 'success' };
        } else {
          throw new Error('Invalid response: ' + text);
        }
      }

      if (result.status === 'success' || result.message === 'Success' || text.toLowerCase().includes('success')) {
        fetchHolidays();
        alert('Holiday deleted successfully!');
      } else {
        throw new Error(result.message || 'Deletion failed');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(`Failed to delete holiday: ${err.message}`);
    }
  };

  const handleAddCompLeave = async () => {
    const { empId, leaves } = compForm;
    if (empId && leaves) {
      try {
        const response = await fetch(SHEETS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'addCompLeave',
            empId,
            leaves: Number(leaves),
          }),
        });
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Invalid JSON: ' + text);
        }
        if (response.ok && data.message?.toLowerCase().includes('success')) {
          alert('Compensation leave added!');
          setCompLeaves((prev) => [...prev, { empId, leaves: Number(leaves) }]);
          setCompForm({ empId: '', leaves: '' });
        } else {
          alert('Failed to add compensation leave: ' + text);
        }
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    }
  };

  const Spinner = () => (
    <div className="flex justify-center items-center py-6">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="w-screen h-screen overflow-x-hidden overflow-y-auto bg-gray-50">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Manage Leaves</p>
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
            <button onClick={() => setIsProfileOpen((prev) => !prev)} className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full">
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
                  <UserCircle className="w-4 h-4 text-green-600" /> View Profile
                </button>
              </div>
            )}
          </div>
          <button className="text-green-700 hover:bg-green-100 p-2 rounded-full transition" onClick={() => navigate('/admin')}>
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6 w-full max-w-7xl mx-auto">
        {/* PENDING LEAVE REQUESTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="w-full max-h-[420px] overflow-y-auto rounded-xl shadow border bg-white p-6">
            <h2 className="text-xl font-bold text-green-700 mb-4">Pending Leave Requests</h2>
            {isLoadingLeaveRequests ? (
              <Spinner />
            ) : leaveRequests.length === 0 ? (
              <p className="text-gray-500">No pending leave requests</p>
            ) : (
              leaveRequests.map((req, idx) => (
                <Card key={`${req.Timestamp}-${req.EmpId}`} className="mb-4 border shadow-sm bg-gray-100">
                  <CardContent className="p-4">
                    <p className="text-lg font-semibold text-black mb-2">
                      Employee: {req.EMP_NAME} {req.EMP_LAST_NAME} (ID: {req.EmpId || 'N/A'})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-200 p-4 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900 mb-1 text-sm">Leave Type</p>
                        <p className="text-base text-gray-800">{req.LeaveType || 'N/A'}</p>
                        <p className="text-sm text-gray-600 mt-1">From: {req.FromDate || '-'} To: {req.ToDate || '-'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1 text-sm">Reason</p>
                        <p className="text-base text-gray-800">{req.Reason || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button
                        className="bg-green-600 text-white hover:bg-green-700"
                        onClick={() => handleLeaveAction(req, 'Approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleLeaveAction(req, 'Rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* COMP-OFF SECTION */}
          <Card className="p-6 border shadow-md">
            <CardContent className="space-y-4">
              <h2 className="text-lg font-bold text-green-700">Compensation Leave</h2>
              <input
                type="text"
                placeholder="Employee ID"
                value={compForm.empId}
                onChange={(e) => setCompForm({ ...compForm, empId: e.target.value })}
                className="w-full border p-2 rounded-md"
              />
              <input
                type="number"
                placeholder="Number of Leaves"
                value={compForm.leaves}
                onChange={(e) => setCompForm({ ...compForm, leaves: e.target.value })}
                className="w-full border p-2 rounded-md"
              />
              <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleAddCompLeave}>
                Add Compensation Leave
              </Button>
              <div className="pt-4 text-sm text-gray-800 space-y-1">
                {compLeaves.map((cl, idx) => (
                  <div key={idx}>Employee {cl.empId} - {cl.leaves} Leave(s)</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HOLIDAY SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 border shadow-md">
            <CardContent className="space-y-4">
              <h2 className="text-lg font-bold text-green-700">Add / Edit Holiday</h2>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={holidayForm.title}
                  onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
                  className="border p-2 rounded-md"
                />
                <input
                  type="date"
                  value={holidayForm.fromDate ? holidayForm.fromDate.slice(0, 10) : ''}
                  onChange={e => setHolidayForm({ ...holidayForm, fromDate: e.target.value })}
                  className="border p-2 rounded-md"
                />
                <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleAddOrUpdateHoliday}>
                  {holidayForm.editIndex !== null ? 'Update Holiday' : 'Add Holiday'}
                </Button>
              </div>
              <div className="pt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Holidays</h3>
                <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 space-y-2">
                  {isLoadingHolidays ? (
                    <Spinner />
                  ) : holidays.map((holiday, idx) => (
                    <div key={idx} className="flex justify-between items-center border px-4 py-2 rounded-md">
                      <div>
                        <div>{holiday.title}</div>
                        <div className="text-xs text-gray-500">{formatDate(holiday.date)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditHoliday(idx)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteHoliday(holiday.date)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6 border shadow-md">
            <CardContent>
              <h2 className="text-lg font-bold text-green-700 mb-4 text-center">This Month's Holidays</h2>
              <Calendar tileClassName={tileClassName} className="rounded-xl w-full mb-4" />
              
              {/* Legend */}
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-green-200 rounded-full border"></div>
                  <span className="text-gray-600">Company Holidays</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-800 space-y-2 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                {holidays
                  .filter(h => {
                    const d = new Date(formatDate(h.date));
                    const now = new Date();
                    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
                  })
                  .map((h, idx) => (
                    <div key={idx}>{formatDate(h.date)}: {h.title}</div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LEAVE HISTORY */}
        <Card className="p-6 border shadow-md mt-6 col-span-2">
          <CardContent>
            <h2 className="text-lg font-bold text-green-700 mb-4">Leave History</h2>
            {isLoadingLeaveHistory ? (
              <Spinner />
            ) : leaveHistory.length === 0 ? (
              <p className="text-gray-500 text-center">No history found.</p>
            ) : (
              <div className="overflow-x-auto max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Date</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Employee</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Type</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">From</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">To</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Status</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveHistory.map((h, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 border-b">{formatDate(h.Timestamp)}</td>
                        <td className="px-4 py-2 border-b">{h.EMP_NAME} {h.EMP_LAST_NAME} ({h.EmpId})</td>
                        <td className="px-4 py-2 border-b">{h.LeaveType}</td>
                        <td className="px-4 py-2 border-b">{formatDate(h.FromDate)}</td>
                        <td className="px-4 py-2 border-b">{formatDate(h.ToDate)}</td>
                        <td className="px-4 py-2 border-b">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            h.Status === 'Approved' 
                              ? 'bg-green-100 text-green-800' 
                              : h.Status === 'Rejected' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {h.Status}
                          </span>
                        </td>
                        <td className="px-4 py-2 border-b">{h.Reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminLeaveManager;