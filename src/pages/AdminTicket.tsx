import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Bell, Home, User, UserCircle } from 'lucide-react';
import AdminTimesheet from './AdminTimesheet'; // Assuming the timesheet is extracted to its own component


// Type definition
type TicketType = {
  ID: string;
  Title: string;
  Priority: string;
  Reason: string;
  Status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  Timestamp: string;
  AssignedTo?: string;
  Comments?: string;
  EmployeeID?: string; // NEW FIELD
};

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwaw9duy2olUB7Va4nlKbR1i8pO2cedHKhaeiO6ExfRFdZH5dwr-sjajgm5NDqzJv1qWw/exec';



const TicketManagement = () => {
  const navigate = useNavigate();
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'employee' | 'admin'>('employee');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown((prev) => !prev);
  };

  useEffect(() => {
    const role = localStorage.getItem('userRole') as 'employee' | 'admin' || 'employee';
    setUserRole(role);

    const storedId = localStorage.getItem('spreadsheetId');
    if (!storedId) {
      console.warn('Missing spreadsheetId in localStorage — using mock data.');
      setSheetId(null);
    } else {
      setSheetId(storedId);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [sheetId]);

  const fetchTickets = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getPending`);
    if (!res.ok) throw new Error('Network response was not ok');
    
    const rawData = await res.json();

    if (!Array.isArray(rawData)) {
      console.error('Invalid ticket data format');
      setTickets([]);
      return;
    }

    // Define valid statuses as TypeScript literal types
    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Completed'] as const;

    const allTickets: TicketType[] = rawData.map((ticket: any) => {
      const rawStatus = (ticket.status || 'Pending').toLowerCase(); // fallback to 'Pending'
      let status: TicketType['Status'] = 'Pending';

      switch (rawStatus) {
        case 'approved':
          status = 'Approved';
          break;
        case 'rejected':
          status = 'Rejected';
          break;
        case 'completed':
          status = 'Completed';
          break;
        default:
          status = 'Pending';
      }

      return {
        ID: String(ticket.id ?? ''),
        Title: String(ticket.title ?? ''),
        Priority: String(ticket.priority ?? 'Low'),
        Reason: String(ticket.reason ?? ''),
        Timestamp: String(ticket.timestamp ?? ''),
        Status: status,
        EmployeeID: String(ticket.employeeId ?? ''),
      };
    });

    const sortedTickets = allTickets.sort(
      (a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
    );

    setTickets(sortedTickets);
  } catch (err) {
    console.error('Fetch error:', err);
    setTickets([]);
  } finally {
    setLoading(false);
  }
};


  const handleStatusUpdate = async (
  ticketId: string,
  newStatus: TicketType['Status'],
  employeeId?: string
) => {
  if (!ticketId) return;

  try {
    const params = new URLSearchParams({ ticketId });
    let action = '';

    if (newStatus === 'Approved' || newStatus === 'Rejected') {
      if (!employeeId) return;
      params.append('employeeId', employeeId);
      action = newStatus === 'Approved' ? 'approve' : 'reject';
    } else if (newStatus === 'Completed') {
      action = 'complete';
    } else {
      return;
    }

    const res = await fetch(`${SCRIPT_URL}?action=${action}&${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const text = await res.text();
    if (text === 'Missing parameters') throw new Error('Missing required parameters');

    console.log(`✅ Ticket ${ticketId} marked as ${newStatus}`);

    await fetchTickets(); // Refresh updated data
  } catch (err) {
    console.error('❌ Status update failed:', err);
  }
};



  const Header = () => (
    <header className="w-full bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
        <div>
          <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
          <p className="text-base font-semibold text-gray-600">
            {userRole === 'admin' ? 'Admin Ticket Dashboard' : 'Employee Ticket System'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <span className="text-lg font-bold text-green-700">EMPWR</span>

        <button className="relative text-green-700 hover:text-green-800">
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative" ref={profileRef}>
          <button 
            onClick={toggleProfileDropdown}
            className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full"
          >
            <User className="w-5 h-5 text-green-700" />
          </button>
          
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg z-50 border border-gray-200">
              <button
                onClick={() => {
                  navigate('/admin/profile');
                  setShowProfileDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-800 hover:bg-green-50 flex items-center gap-2 text-sm"
              >
                <UserCircle className="w-4 h-4 text-green-600" />
                View Profile
              </button>
              <div className="border-t border-gray-200"></div>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/admin')}
          className="text-green-700 hover:bg-green-100 p-2 rounded-full transition"
        >
          <Home className="h-5 w-5" />
        </button>
      </div>
    </header>
  );

  const getStatusColor = (status: TicketType['Status']) => {
    switch (status) {
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 p-6 flex flex-col items-center">
        <div className="w-full max-w-6xl grid gap-10">
          

          {/* Ticket List */}
          {/* 1️⃣ Pending Tickets Table (No Status Column) */}
          {/* 1️⃣ Pending Tickets Table */}
<h3 className="text-lg font-bold text-gray-700 mt-10">Pending Tickets</h3>
<div className="bg-white rounded-xl shadow overflow-x-auto">
  <table className="min-w-full text-sm text-gray-700">
    <thead className="bg-blue-100 text-gray-800 font-semibold">
      <tr>
        <th className="p-4 text-left">Employee ID</th>
        <th className="p-4 text-left">ID</th>
        <th className="p-4 text-left">Title</th>
        <th className="p-4 text-left">Priority</th>
        <th className="p-4 text-left">Timestamp</th>
        <th className="p-4 text-left">Actions</th>
      </tr>
    </thead>
    <tbody>
      {tickets.filter(t => t.Status === 'Pending').map((ticket, i) => (
        <tr key={i} className="border-t hover:bg-gray-50">
          <td className="p-4">{ticket.EmployeeID || 'EMP-001'}</td>
          <td className="p-4 font-semibold">{ticket.ID}</td>
          <td className="p-4">{ticket.Title}</td>
          <td className="p-4">{ticket.Priority}</td>
          <td className="p-4">{ticket.Timestamp}</td>
          <td className="p-4 flex gap-2">
            <Button
              onClick={() => handleStatusUpdate(ticket.ID, 'Approved', ticket.EmployeeID)}
              className="bg-blue-600 text-white text-xs px-3 py-1"
            >
              Approve
            </Button>
            <Button
              onClick={() => handleStatusUpdate(ticket.ID, 'Rejected', ticket.EmployeeID)}
              className="bg-red-600 text-white text-xs px-3 py-1"
            >
              Reject
            </Button>

          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{/* 2️⃣ Approved Requests Table */}
<h3 className="text-lg font-bold text-gray-700 mt-10">Approved Requests</h3>
<div className="bg-white rounded-xl shadow overflow-x-auto">
  <table className="min-w-full text-sm text-gray-700">
    <thead className="bg-green-100 text-gray-800 font-semibold">
      <tr>
        <th className="p-4 text-left">Employee ID</th>
        <th className="p-4 text-left">ID</th>
        <th className="p-4 text-left">Title</th>
        <th className="p-4 text-left">Priority</th>
        <th className="p-4 text-left">Timestamp</th>
        <th className="p-4 text-left">Status</th>
        <th className="p-4 text-left">Action</th>
      </tr>
    </thead>
    <tbody>
      {tickets.filter(t => t.Status === 'Approved').map((ticket, i) => (
        <tr key={i} className="border-t hover:bg-gray-50">
          <td className="p-4">{ticket.EmployeeID || 'EMP-001'}</td>
          <td className="p-4 font-semibold">{ticket.ID}</td>
          <td className="p-4">{ticket.Title}</td>
          <td className="p-4">{ticket.Priority}</td>
          <td className="p-4">{ticket.Timestamp}</td>
          <td className="p-4">
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Approved</span>
          </td>
          <td className="p-4">
            <Button
              onClick={() => handleStatusUpdate(ticket.ID, 'Completed')}
              className="bg-green-600 text-white text-xs px-3 py-1"
            >
              Completed
            </Button>

          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{/* 3️⃣ Completed Tickets Table */}
<h3 className="text-lg font-bold text-gray-700 mt-10">Completed Tickets</h3>
<div className="bg-white rounded-xl shadow overflow-x-auto">
  <table className="min-w-full text-sm text-gray-700">
    <thead className="bg-gray-200 text-gray-800 font-semibold">
      <tr>
        <th className="p-4 text-left">Employee ID</th>
        <th className="p-4 text-left">ID</th>
        <th className="p-4 text-left">Title</th>
        <th className="p-4 text-left">Priority</th>
        <th className="p-4 text-left">Timestamp</th>
        <th className="p-4 text-left">Status</th>
      </tr>
    </thead>
    <tbody>
      {tickets.filter(t => t.Status === 'Completed').map((ticket, i) => (
        <tr key={i} className="border-t hover:bg-gray-50">
          <td className="p-4">{ticket.EmployeeID || 'EMP-001'}</td>
          <td className="p-4 font-semibold">{ticket.ID}</td>
          <td className="p-4">{ticket.Title}</td>
          <td className="p-4">{ticket.Priority}</td>
          <td className="p-4">{ticket.Timestamp}</td>
          <td className="p-4">
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>




          
        </div>
      </div>
    </div>
  );
};

export default TicketManagement;