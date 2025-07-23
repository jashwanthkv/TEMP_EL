import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, User, Home, UserCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import clsx from 'clsx';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'read', label: 'Read' },
];

type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

const initialData: Notification[] = [
  {
    id: 1,
    title: 'Leave Approved',
    message: 'Your casual leave request for July 28th has been approved. Enjoy your time off!',
    time: '10:30 AM, July 22, 2025',
    read: false,
  },
  {
    id: 2,
    title: 'System Update',
    message: 'Your password was changed successfully. If this wasn’t you, please contact IT support immediately.',
    time: '3:00 PM, July 21, 2025',
    read: true,
  },
  {
    id: 3,
    title: 'Meeting Reminder',
    message: 'You have a meeting scheduled with the project team in 30 minutes. Check your calendar.',
    time: '9:00 AM, July 21, 2025',
    read: false,
  },
];

const Notifications = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>(initialData);
  const [selectedMessage, setSelectedMessage] = useState<Notification | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !(profileRef.current as any).contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenMessage = (msg: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === msg.id ? { ...n, read: true } : n))
    );
    setSelectedMessage(msg);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (tab === 'all') return true;
    if (tab === 'read') return n.read;
    return !n.read;
  });

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto" />
          <div>
            <p className="text-lg font-bold text-green-700">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-sm text-gray-600">Notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-lg font-bold text-green-700">EMPWR</span>
          <div className="relative" ref={profileRef}>
            <button onClick={() => setIsProfileOpen((prev) => !prev)} className="rounded-full p-2 hover:bg-green-100">
              <User className="w-5 h-5 text-green-700" />
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded shadow z-50">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsProfileOpen(false);
                  }}
                  className="w-full px-4 py-2 flex items-center gap-2 hover:bg-green-50"
                >
                  <UserCircle className="w-4 h-4 text-green-600" /> View Profile
                </button>
              </div>
            )}
          </div>
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-green-100 rounded-full">
            <Home className="w-5 h-5 text-green-700" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200 mb-6 pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setSelectedMessage(null);
              }}
              className={clsx(
                'pb-2 font-medium text-sm',
                tab === t.id ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-green-600'
              )}
            >
              {t.label} Messages
            </button>
          ))}
        </div>

        {/* Message List or Detail View */}
        {selectedMessage ? (
          <Card className="shadow-md bg-white p-6 relative">
            <button
              onClick={() => setSelectedMessage(null)}
              className="absolute top-4 right-4 p-1 text-gray-500 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="text-blue-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedMessage.title}</h3>
                <p className="text-sm text-gray-500">{selectedMessage.time}</p>
              </div>
            </div>
            <p className="text-gray-800 leading-relaxed">{selectedMessage.message}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((n) => (
              <Card
                key={n.id}
                onClick={() => handleOpenMessage(n)}
                className={clsx(
                  'cursor-pointer transition-shadow shadow-sm hover:shadow-md',
                  n.read ? 'bg-white' : 'bg-green-50'
                )}
              >
                <CardContent className="flex gap-4 p-5">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail className="text-blue-600 w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{n.title}</p>
                    <p className="text-sm text-gray-700 mt-1 truncate">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredNotifications.length === 0 && (
              <p className="text-gray-500 text-center py-10">No {tab} messages available.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
