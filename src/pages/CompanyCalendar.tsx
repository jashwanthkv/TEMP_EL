import React, { useState, useRef, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
} from 'date-fns';
import { Home, Bell, User, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RequireLogin from '@/components/ui/RequireLogin';

interface Event {
  Title: string;
  Date: string;
  Description: string;
  Time?: string;
}

const BACKEND_URL =
  'https://script.google.com/macros/s/AKfycbxg9PC7Mp0bFu_aJ3iT9TclwPuuMq_ShXy-5-RsoL52jXy38R2m2V_7PJKkloBhZ4iY/exec';

const CompanyCalendar: React.FC = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  const navigate = useNavigate();
  const today = new Date();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Loading Spinner Component
  const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-green-500"></div>
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading Calendar Data...</p>
      </div>
    </div>
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parseDate = (str: string): Date | null => {
    if (!str) return null;
    const [day, month, year] = str.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  };

  const getEventsForDate = (date: Date) =>
    events.filter((e) => {
      const eventDate = parseDate(e.Date);
      return eventDate && isSameDay(eventDate, date);
    });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}?action=upcoming`);
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const onFocus = () => {
      fetchEvents();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const getBoxColor = (count: number) => {
    if (count === 0) return 'bg-white';
    if (count === 1) return 'bg-green-100';
    if (count === 2) return 'bg-orange-200';
    return 'bg-red-300';
  };

  const start = startOfWeek(startOfMonth(today), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(today), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    days.push(d);
  }

  // Show loading spinner until all data is loaded
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
  // Main content after loading
  
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Company Calendar</p>
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

          {/* Profile Dropdown */}
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
            className="w-10 h-10 flex items-center justify-center text-green-700 hover:bg-green-100 rounded-full"
            aria-label="Dashboard"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[700px]">
        {/* Calendar */}
        <div className="order-1 lg:order-2 bg-white rounded-xl shadow-md p-4 lg:col-span-3 flex flex-col min-h-full">
          <div className="grid grid-cols-7 gap-px flex-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="font-semibold text-gray-600 py-2 bg-slate-50 text-center">
                {day}
              </div>
            ))}
            {days.map((day, i) => {
              const eventCount = getEventsForDate(day).length;
              const isCurrentMonth = day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
              const cellColor = eventCount > 0 ? getBoxColor(eventCount) : (isCurrentMonth ? 'bg-blue-50' : getBoxColor(eventCount));
              return (
                <div
                  key={i}
                  onClick={() => handleDateClick(day)}
                  className={`relative h-28 p-1 border cursor-pointer flex flex-col justify-center items-center text-center ${cellColor}`}
                >
                  <div className="absolute top-1 right-1 text-[10px] text-gray-600">
                    {format(day, 'd')}
                  </div>
                  {eventCount > 0 && (
                    <div className="font-bold text-gray-800 text-sm text-center">
                      {eventCount} {eventCount > 1 ? 'events' : 'event'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="order-2 lg:order-1 bg-white rounded-xl shadow-md p-6 space-y-4 flex flex-col min-h-full" style={{ height: '600px' }}>
          <h2 className="text-lg font-bold text-green-700">Upcoming Events</h2>
          <div className="overflow-y-auto" style={{ height: '100%' }}>
            <ul className="space-y-3">
              {events
                .filter((ev) => {
                  const evDate = parseDate(ev.Date);
                  return evDate && evDate >= today;
                })
                .sort((a, b) => {
                  const d1 = parseDate(a.Date)?.getTime() || 0;
                  const d2 = parseDate(b.Date)?.getTime() || 0;
                  return d1 - d2;
                })
                .map((ev, i) => (
                  <li key={i} className="bg-green-50 p-3 rounded-md shadow">
                    <p className="font-bold text-green-800 text-sm">{ev.Title}</p>
                    <p className="text-xs text-gray-500">
                      {format(parseDate(ev.Date)!, 'EEE, dd MMM yyyy')}
                    </p>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Modal */}
      {modalOpen && selectedDate && (
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg relative"
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-4 text-gray-600 hover:text-gray-800 text-xl"
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-4 text-green-700">
              Events on {format(selectedDate, 'EEE, dd MMM yyyy')}
            </h3>
            {getEventsForDate(selectedDate).length > 0 ? (
              <ul className="space-y-4">
                {getEventsForDate(selectedDate).map((ev, i) => {
                  let formattedTime = 'N/A';
                  if (ev.Time) {
                    const raw = ev.Time.trim().replace(/"/g, '');
                    if (/am|pm/i.test(raw)) {
                      formattedTime = raw;
                    } else {
                      let parts = raw.includes('.') ? raw.split('.') : raw.split(':');
                      if (parts.length === 2) {
                        let hour = parseInt(parts[0], 10);
                        let minute = parseInt(parts[1], 10);
                        if (isNaN(hour)) hour = 0;
                        if (isNaN(minute)) minute = 0;
                        let ampm = 'AM';
                        if (hour >= 12) {
                          ampm = 'PM';
                          if (hour > 12) hour -= 12;
                        }
                        formattedTime = `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
                      } else if (parts.length === 1) {
                        let hour = parseInt(parts[0], 10);
                        let ampm = 'AM';
                        if (hour >= 12) {
                          ampm = 'PM';
                          if (hour > 12) hour -= 12;
                        }
                        formattedTime = `${hour}:00 ${ampm}`;
                      } else {
                        formattedTime = raw;
                      }
                    }
                  }
                  return (
                    <li
                      key={i}
                      className="border-l-4 border-green-600 pl-4 bg-green-50 p-3 rounded-md shadow-sm"
                    >
                      <p className="font-bold text-green-800">{ev.Title}</p>
                      <p className="text-sm text-gray-600">{ev.Description}</p>
                      <p className="text-xs text-gray-500">🕒 {formattedTime}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500">No events on this day.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyCalendar;