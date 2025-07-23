import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Home, Bell, User, UserCircle } from 'lucide-react';


interface Ticket {
  id: string;
  tokenId: string;
  title: string;
  description: string;
  requester: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo: string;
  comments: string[];
}

const tickets: Ticket[] = [
  {
    id: 'TCKT001',
    tokenId: 'TOK12345',
    title: 'Email not working',
    description: 'Unable to send emails since morning',
    requester: 'Sridhar K',
    priority: 'High',
    status: 'In Progress',
    assignedTo: 'IT Team',
    comments: ['Investigating mail server', 'Temporary fix applied'],
  },
  {
    id: 'TCKT002',
    tokenId: 'TOK12346',
    title: 'VPN Connection Issue',
    description: 'VPN disconnects frequently',
    requester: 'Anita R',
    priority: 'Medium',
    status: 'Open',
    assignedTo: 'Network Admin',
    comments: [],
  },
  {
    id: 'TCKT003',
    tokenId: 'TOK12347',
    title: 'Payroll mismatch',
    description: 'Incorrect salary credited this month',
    requester: 'David P',
    priority: 'High',
    status: 'Resolved',
    assignedTo: 'HR Team',
    comments: ['Corrected in next payroll cycle'],
  },
  {
    id: 'TCKT004',
    tokenId: 'TOK12348',
    title: 'Laptop overheating',
    description: 'Device gets hot during meetings',
    requester: 'Priya N',
    priority: 'Low',
    status: 'Closed',
    assignedTo: 'IT Support',
    comments: ['Cleaned fan and applied thermal paste'],
  },
  {
    id: 'TCKT005',
    tokenId: 'TOK12349',
    title: 'Project access needed',
    description: 'Need access to project repo for new task',
    requester: 'Rahul M',
    priority: 'Medium',
    status: 'Open',
    assignedTo: 'DevOps Team',
    comments: [],
  },
  {
    id: 'TCKT006',
    tokenId: 'TOK12350',
    title: 'Outlook crashes on launch',
    description: 'Outlook app not opening',
    requester: 'Neha J',
    priority: 'High',
    status: 'In Progress',
    assignedTo: 'IT Support',
    comments: ['Reinstalling Office Suite'],
  },
  {
    id: 'TCKT007',
    tokenId: 'TOK12351',
    title: 'Meeting room booking issue',
    description: 'Unable to book via calendar',
    requester: 'Sameer R',
    priority: 'Low',
    status: 'Resolved',
    assignedTo: 'Admin Team',
    comments: ['Fixed calendar permissions'],
  },
  {
    id: 'TCKT008',
    tokenId: 'TOK12352',
    title: 'Performance dashboard error',
    description: 'Graph not loading properly',
    requester: 'Ayesha T',
    priority: 'Medium',
    status: 'In Progress',
    assignedTo: 'Analytics Team',
    comments: ['Bug logged in Jira'],
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Open':
      return 'text-yellow-600';
    case 'In Progress':
      return 'text-blue-600';
    case 'Resolved':
      return 'text-green-600';
    case 'Closed':
      return 'text-gray-500';
    default:
      return 'text-gray-700';
  }
};

const AdminTicket: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Admin Tickets</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <span className="text-lg font-bold text-green-700">EMPWR</span>

          <button className="relative text-green-700 hover:text-green-800">
            <Bell className="h-6 w-6" />
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

          <button onClick={() => navigate('/admin')} className="text-green-700 hover:bg-green-100 p-2 rounded-full transition">
            <Home className="h-5 w-5" />
          </button>

          
        </div>
      </header>

      {/* Ticket Table */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-blue-100 text-left text-gray-700 font-semibold">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Title</th>
              <th className="p-4">Requester</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">Assigned To</th>
              <th className="p-4">Comments</th>
              <th className="p-4">Token</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium text-blue-600">{ticket.id}</td>
                <td className="p-4">{ticket.title}</td>
                <td className="p-4">{ticket.requester}</td>
                <td className="p-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      ticket.priority === 'High'
                        ? 'bg-red-100 text-red-600'
                        : ticket.priority === 'Medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {ticket.priority}
                  </span>
                </td>
                <td className={`p-4 ${getStatusColor(ticket.status)} font-semibold`}>
                  {ticket.status}
                </td>
                <td className="p-4">{ticket.assignedTo}</td>
                <td className="p-4 text-gray-500">
                  {ticket.comments.length > 0 ? ticket.comments.join(', ') : 'No comments'}
                </td>
                <td className="p-4 font-mono text-xs text-gray-600">{ticket.tokenId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTicket;
