import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Home, Bell, User, UserCircle, Pencil, Trash2 } from 'lucide-react';

const AdminLeaveManager = () => {
  const navigate = useNavigate();

  const [leaveRequests, setLeaveRequests] = useState([
    {
      empId: 'EMP001',
      name: 'John Doe',
      department: 'Engineering',
      leaveType: 'Sick Leave',
      startDate: '2025-07-20',
      endDate: '2025-07-22',
      reason: 'Fever and cold',
      status: 'Pending',
      history: [
        { type: 'Casual Leave', from: '2025-06-10', to: '2025-06-12', status: 'Approved' },
        { type: 'Earned Leave', from: '2025-05-05', to: '2025-05-06', status: 'Rejected' },
      ],
    },
  ]);

  const [holidays, setHolidays] = useState([
    { title: 'Independence Day', date: '2025-08-15', category: 'National' },
    { title: 'Company Day', date: '2025-07-28', category: 'Company' },
  ]);

  const [holidayForm, setHolidayForm] = useState({
    title: '',
    fromDate: '',
    toDate: '',
    category: '',
    editIndex: null,
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      const isHoliday = holidays.some((h) => h.date === dateStr);
      if (isHoliday) {
        return 'bg-red-500 text-white font-semibold rounded-full';
      }
    }
    return '';
  };

  const handleAddOrUpdateHoliday = () => {
    const { title, fromDate, category, editIndex } = holidayForm;
    if (title && fromDate && category) {
      const newHoliday = { title, date: fromDate, category };
      if (editIndex !== null) {
        const updated = [...holidays];
        updated[editIndex] = newHoliday;
        setHolidays(updated);
      } else {
        setHolidays((prev) => [...prev, newHoliday]);
      }
      setHolidayForm({ title: '', fromDate: '', toDate: '', category: '', editIndex: null });
    }
  };

  const handleEditHoliday = (index) => {
    const h = holidays[index];
    setHolidayForm({ title: h.title, fromDate: h.date, toDate: h.date, category: h.category, editIndex: index });
  };

  const handleDeleteHoliday = (date) => {
    setHolidays((prev) => prev.filter((h) => h.date !== date));
  };

  return (
    <div className="w-screen h-screen overflow-x-hidden overflow-y-auto bg-gray-50">
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
          <button className="relative text-green-700 hover:text-green-800">
            <Bell className="h-5 w-5" />
          </button>
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
          <button
            className="text-green-700 hover:bg-green-100 p-2 rounded-full transition"
            onClick={() => navigate('/admin')}
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6 w-full max-w-7xl mx-auto">
        <div className="w-full max-h-[420px] overflow-y-auto rounded-xl shadow border bg-white p-6">
          <h2 className="text-xl font-bold text-green-700 mb-4">Pending Leave Requests</h2>
          {/* Inside the Leave Requests section */}
{leaveRequests.map((req, idx) => (
  <Card key={idx} className="mb-4 border shadow-sm bg-gray-100">
    <CardContent className="p-4">
      <p className="text-lg font-semibold text-black mb-2">
        {req.name} ({req.empId}) - {req.department}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-200 p-4 rounded-lg">
        <div>
          <p className="font-semibold text-gray-900 mb-1 text-sm">Leave Type</p>
          <p className="text-base text-gray-800">{req.leaveType}</p>
          <p className="text-sm text-gray-600 mt-1">From: {req.startDate} To: {req.endDate}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900 mb-1 text-sm">Reason</p>
          <p className="text-base text-gray-800">{req.reason}</p>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <Button className="bg-green-600 text-white hover:bg-blue-700">Approve</Button>
        <Button variant="destructive">Reject</Button>
      </div>
    </CardContent>
  </Card>
))}

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 border shadow-md">
            <CardContent className="space-y-4">
              <h2 className="text-lg font-bold text-green-700">Add / Edit Holiday</h2>
              {/* Inside Add / Edit Holiday form */}
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
    value={holidayForm.fromDate}
    onChange={(e) => setHolidayForm({ ...holidayForm, fromDate: e.target.value })}
    className="border p-2 rounded-md"
  />
  <Button
    className="bg-green-600 text-white hover:bg-green-700"
    onClick={handleAddOrUpdateHoliday}
  >
    {holidayForm.editIndex !== null ? 'Update Holiday' : 'Add Holiday'}
  </Button>
</div>

              <div className="pt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Existing Holidays</h3>
                {holidays.map((holiday, idx) => (
                  <div key={idx} className="flex justify-between items-center border px-4 py-2 rounded-md mb-2">
                    <div>
                      <p className="font-medium text-base text-gray-800">{holiday.title}</p>
                      <p className="text-sm text-gray-600">{holiday.date}</p>
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
            </CardContent>
          </Card>

          <Card className="p-6 border shadow-md">
            <CardContent>
              <h2 className="text-lg font-bold text-green-700 mb-4 text-center">This Month's Holidays</h2>
              <Calendar tileClassName={tileClassName} className="rounded-xl w-full mb-4" />
              <div className="text-sm text-gray-800 space-y-2">
                {holidays.map((h, idx) => (
                  <div key={idx}>{h.date}: {h.title} </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminLeaveManager;
