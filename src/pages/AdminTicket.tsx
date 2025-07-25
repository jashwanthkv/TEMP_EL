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
};

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJ460fW7M-OyARIkITeyjG90BVh5V1sVzStndHW2posqFx8M6UjUBGmJKp4wg3ZtU1/exec';

const mockTickets: TicketType[] = [
  {
    ID: "TKT-001",
    Title: "Laptop not turning on",
    Priority: "High",
    Reason: "My work laptop suddenly stopped powering on.",
    Status: "Pending",
    Timestamp: "2023-05-15 09:23:45",
    AssignedTo: "IT Support",
    Comments: "Please check power adapter first"
  },
  {
    ID: "TKT-002",
    Title: "Software license renewal",
    Priority: "Medium",
    Reason: "Adobe Creative Cloud license expires next week.",
    Status: "Approved",
    Timestamp: "2023-05-14 14:10:22",
    AssignedTo: "Finance Dept",
    Comments: "Approved - budget allocated"
  },
  {
    ID: "TKT-003",
    Title: "Office chair repair",
    Priority: "Low",
    Reason: "Chair wheels are broken making it difficult to move around",
    Status: "Rejected",
    Timestamp: "2023-05-13 11:45:10",
    AssignedTo: "Facilities",
    Comments: "Not covered under warranty"
  },
  {
    ID: "TKT-004",
    Title: "VPN connection issues",
    Priority: "High",
    Reason: "Cannot connect to company VPN from home office",
    Status: "Completed",
    Timestamp: "2023-05-12 16:30:05",
    AssignedTo: "IT Support",
    Comments: "Issue resolved after client update"
  }
];

const TicketManagement = () => {
  const navigate = useNavigate();
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTicket, setNewTicket] = useState({
    title: '',
    reason: '',
    priority: 'Low',
    status: 'Pending' as const,
  });
  const [userRole, setUserRole] = useState<'employee' | 'admin'>('employee');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

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
      if (sheetId) {
        const res = await fetch(`${SCRIPT_URL}?sheetId=${sheetId}&action=fetch`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const normalized = data.data.map((ticket: any) => ({
            ID: ticket.ID || '-',
            Title: ticket.TITLE || '-',
            Priority: ticket.PRIORITY || '-',
            Reason: ticket.REASON || '-',
            Status: ticket.STATUS || 'Pending',
            Timestamp: ticket.TIMESTAMP || '-',
            AssignedTo: ticket.ASSIGNED_TO || '-',
            Comments: ticket.COMMENTS || '-',
          }));
          setTickets(normalized.reverse());
        } else {
          console.warn('Empty response from API. Using mock data.');
          setTickets([...mockTickets]);
        }
      } else {
        console.log('No sheet ID — using mock data only.');
        setTickets([...mockTickets]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setTickets([...mockTickets]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const { title, reason, priority } = newTicket;
    if (!title || !reason || !sheetId) {
      alert('Please fill all fields.');
      return;
    }

    const params = new URLSearchParams({
      sheetId,
      action: 'append',
      title,
      reason,
      priority,
      status: 'Pending', // Always start as Pending
    });

    try {
      const res = await fetch(`${SCRIPT_URL}?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        alert('Ticket submitted!');
        setNewTicket({
          title: '',
          reason: '',
          priority: 'Low',
          status: 'Pending',
        });
        fetchTickets();
      } else {
        alert('Submission failed: ' + data.message);
      }
    } catch (err) {
      console.error('Error submitting ticket:', err);
    }
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: TicketType['Status'], comments = '') => {
    if (!sheetId) return;

    try {
      const params = new URLSearchParams({
        sheetId,
        action: 'update',
        id: ticketId,
        status: newStatus,
        comments,
      });

      const res = await fetch(`${SCRIPT_URL}?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        alert(`Ticket marked as ${newStatus}!`);
        fetchTickets();
      } else {
        alert('Update failed: ' + data.message);
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
    }
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
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
          {/* New Ticket Form - Only for employees */}
          {userRole === 'employee' && (
            <div className="bg-white w-full p-6 rounded-xl shadow space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Raise a New Ticket</h2>
              <Input
                placeholder="Issue Title"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              />
              <Textarea
                placeholder="Describe your issue..."
                value={newTicket.reason}
                onChange={(e) => setNewTicket({ ...newTicket, reason: e.target.value })}
              />
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm">Priority:</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <Button
                onClick={handleSubmit}
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-full"
              >
                Submit Ticket
              </Button>
            </div>
          )}

          {/* Ticket List */}
          <div className="w-full bg-white rounded-xl shadow overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-blue-100 text-gray-800 font-semibold">
                <tr>
                  <th className="p-4 text-left">ID</th>
                  <th className="p-4 text-left">Title</th>
                  <th className="p-4 text-left">Priority</th>
                  {userRole === 'admin' && <th className="p-4 text-left">Assigned To</th>}
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Timestamp</th>
                  {userRole === 'admin' && <th className="p-4 text-left">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-4 text-center" colSpan={userRole === 'admin' ? 7 : 6}>
                      Loading...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td className="p-4 text-center" colSpan={userRole === 'admin' ? 7 : 6}>
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="p-4 font-semibold text-blue-600">{ticket.ID || '-'}</td>
                      <td className="p-4">{ticket.Title || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          ticket.Priority === 'High' ? 'bg-red-100 text-red-800' :
                          ticket.Priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.Priority || '-'}
                        </span>
                      </td>
                      {userRole === 'admin' && (
                        <td className="p-4">
                          <Input 
                            value={ticket.AssignedTo || ''} 
                            onChange={(e) => {
                              const updatedTickets = [...tickets];
                              updatedTickets[i].AssignedTo = e.target.value;
                              setTickets(updatedTickets);
                            }}
                            className="w-32"
                          />
                        </td>
                      )}
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(ticket.Status)}`}>
                          {ticket.Status || '-'}
                        </span>
                      </td>
                      <td className="p-4">{ticket.Timestamp || '-'}</td>
                      {userRole === 'admin' && (
                        <td className="p-4 flex gap-2">
                          {ticket.Status === 'Pending' && (
                            <>
                              <Button
                                onClick={() => handleStatusUpdate(ticket.ID, 'Approved')}
                                className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-3 py-1"
                                size="sm"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleStatusUpdate(ticket.ID, 'Rejected')}
                                className="bg-red-600 text-white hover:bg-red-700 text-xs px-3 py-1"
                                size="sm"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {ticket.Status === 'Approved' && (
                            <Button
                              onClick={() => handleStatusUpdate(ticket.ID, 'Completed')}
                              className="bg-green-600 text-white hover:bg-green-700 text-xs px-3 py-1"
                              size="sm"
                            >
                              Mark Complete
                            </Button>
                          )}
                          <Button
                            onClick={() => {
                              const comments = prompt('Enter comments:', ticket.Comments || '');
                              if (comments !== null) {
                                handleStatusUpdate(ticket.ID, ticket.Status, comments);
                              }
                            }}
                            className="bg-gray-600 text-white hover:bg-gray-700 text-xs px-3 py-1"
                            size="sm"
                          >
                            Comment
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketManagement;