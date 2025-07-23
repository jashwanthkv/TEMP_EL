import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const notifications = [
  {
    type: 'LeaveRequest',
    title: 'New Leave Request from EMP002',
    message: 'Samantha requested Sick Leave from 10th to 12th July.',
    timestamp: '2025-07-09 10:15 AM',
  },
  {
    type: 'DocumentRequest',
    title: 'Document Request: Bonafide',
    message: 'Raj (EMP007) requested a Bonafide certificate.',
    timestamp: '2025-07-08 03:40 PM',
  },
  {
    type: 'Holiday',
    title: 'Holiday Added',
    message: 'Independence Day (15th Aug) added to the calendar.',
    timestamp: '2025-07-07 09:00 AM',
  },
  {
    type: 'LeaveRequest',
    title: 'Leave Request Approved',
    message: 'EMP005’s Annual Leave has been approved.',
    timestamp: '2025-07-06 05:25 PM',
  },
];

const AdminNotifications = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      

      <div className="space-y-4">
        {notifications.map((note, idx) => (
          <div
            key={idx}
            className="bg-white border-l-4 p-4 rounded shadow-sm"
            style={{
              borderColor:
                note.type === 'LeaveRequest'
                  ? '#F59E0B'
                  : note.type === 'DocumentRequest'
                  ? '#6366F1'
                  : '#10B981',
            }}
          >
            <p className="text-gray-800 font-semibold mb-1">{note.title}</p>
            <p className="text-gray-600 text-sm">{note.message}</p>
            <p className="text-xs text-gray-400 mt-1">{note.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminNotifications;
