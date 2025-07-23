import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { sendRequest } from '../lib/api';
import { Home, Bell, User, UserCircle } from 'lucide-react';

interface LeaveRequest {
  empId: string;
  name: string;
  email: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  reason: string;
  status: string;
}

interface Holiday {
  id: number;
  date: string;
  occasion: string;
}

const AdminLeaveManager = () => {
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    fetchLeaveRequests();
    fetchHolidays();
  }, []);

  const fetchLeaveRequests = async () => {
    const res = await sendRequest({ action: 'getLeaveRequests' });
    if (res.success) {
      setLeaveRequests(res.requests || []);
    }
  };

  const fetchHolidays = async () => {
    const res = await sendRequest({ action: 'getHolidays' });
    if (res.success) {
      setHolidays(res.holidays || []);
    }
  };

  useEffect(() => {
    leaveRequests.forEach(async (req) => {
      if (
        req.leaveType.toLowerCase() === 'emergency' &&
        req.status.toLowerCase() === 'pending'
      ) {
        await sendRequest({
          action: 'approveLeave',
          email: req.email,
          startDate: req.startDate,
        });
        fetchLeaveRequests();
      }
    });
  }, [leaveRequests]);

  const handleApprove = async (email: string, startDate: string) => {
    const res = await sendRequest({ action: 'approveLeave', email, startDate });
    if (res.success) {
      alert('✅ Leave approved');
      fetchLeaveRequests();
    }
  };

  const handleReject = async (email: string, startDate: string) => {
    const res = await sendRequest({ action: 'rejectLeave', email, startDate });
    if (res.success) {
      alert('❌ Leave rejected');
      fetchLeaveRequests();
    }
  };

  const handleAddHoliday = async () => {
    const date = prompt('Enter holiday date (YYYY-MM-DD):');
    const occasion = prompt('Enter occasion:');
    if (date && occasion) {
      const res = await sendRequest({ action: 'addHoliday', date, occasion });
      if (res.success) {
        alert('✅ Holiday added');
        fetchHolidays();
      }
    }
  };

  const handleRemoveHoliday = async (date: string) => {
    const res = await sendRequest({ action: 'removeHoliday', date });
    if (res.success) {
      alert('🗑️ Holiday removed');
      fetchHolidays();
    }
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      const holiday = holidays.find((h) => h.date === dateStr);
      if (holiday) {
        return 'bg-red-500 text-white font-semibold rounded-full';
      }
    }
    return '';
  };

  const filteredRequests = leaveRequests.filter(
    (req) =>
      req.status.toLowerCase() === 'pending' &&
      req.leaveType.toLowerCase() !== 'emergency'
  );

  return (
    <div className="w-full p-0 m-0">
      {/* Header */}
      <header className="w-screen bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Aprove Leaves</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <span className="text-lg font-bold text-green-700">EMPWR</span>

          <button className="relative text-green-700 hover:text-green-800">
            <Bell className="h-5 w-5" />
          </button>

          <div className="relative group">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full">
              <User className="w-5 h-5 text-green-700" />
            </button>
            <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transform transition-all duration-200 z-50">
              <button
                onClick={() => navigate('/profile')}
                className="w-full px-4 py-2 text-left text-gray-800 hover:bg-green-50 flex items-center gap-2"
              >
                <UserCircle className="w-4 h-4 text-green-600" />
                View Profile
              </button>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin')}
            className="text-green-700 hover:bg-green-100 p-2 rounded-full transition"
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>


      {/* Leave Requests */}
      <div className="px-16 py-4">
        {filteredRequests.length === 0 ? (
          <p className="text-gray-500 italic">No pending leave requests.</p>
        ) : (
          filteredRequests.map((req, index) => (
            <Card key={`${req.email}-${index}`} className="shadow-sm border w-full min-h-[160px] mb-4">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">
                    {req.name} ({req.empId})
                  </p>
                  <p className="text-base">
                    Type: {req.leaveType} — {req.startDate} to {req.endDate}
                  </p>
                  <p>Requested Days: {req.requestedDays}</p>
                  <p className="text-gray-700 italic">Reason: {req.reason}</p>
                </div>
                <div className="space-x-3">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleApprove(req.email, req.startDate)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(req.email, req.startDate)}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Holidays + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-16 py-6">
        {/* Holidays */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Public Holidays</h2>
          <div className="grid gap-4">
            {holidays.map((holiday) => (
              <Card key={holiday.date} className="shadow-sm border">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{holiday.occasion}</p>
                    <p>{holiday.date}</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => handleRemoveHoliday(holiday.date)}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4">
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleAddHoliday}
            >
              ➕ Add Holiday
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <div className="w-full flex justify-center items-start">
          <div className="border rounded-2xl p-4 bg-white shadow-sm w-[340px]">
            <h3 className="text-lg font-semibold mb-2 text-center">Holiday Calendar</h3>
            <Calendar tileClassName={tileClassName} className="rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveManager;
