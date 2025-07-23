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

interface Event {
  Title: string;
  Date: string;
  Description: string;
  Time?: string;
}

const BACKEND_URL =
  'https://script.google.com/macros/s/AKfycbweZCpXW1iauZaMsdQjJHZSlv9GhVV-3Tf87bJE7d2c7OFvLIuj0UeMxPwD8-Nhpt13GA/exec';

const CompanyCalendar: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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
      try {
        setLoading(true);
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
    window.addEventListener('focus', fetchEvents);
    return () => window.removeEventListener('focus', fetchEvents);
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

  return (
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


          {/* Profile Dropdown (Click-based) */}
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
      <main className="max-w-[1600px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar */}
        <div className="order-1 lg:order-2 bg-white rounded-xl shadow-md p-4 lg:col-span-3">
          {loading ? (
            <div className="text-center py-10 text-green-600 font-semibold">Loading events...</div>
          ) : (
            <div className="grid grid-cols-7 gap-px">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="font-semibold text-gray-600 py-2 bg-slate-50 text-center">
                  {day}
                </div>
              ))}
              {days.map((day, i) => {
                const eventCount = getEventsForDate(day).length;
                return (
                  <div
                    key={i}
                    onClick={() => handleDateClick(day)}
                    className={`relative h-28 p-1 border ${getBoxColor(eventCount)} cursor-pointer flex flex-col justify-center items-center text-center`}
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
          )}
        </div>

        {/* Upcoming Events */}
        <div className="order-2 lg:order-1 bg-white rounded-xl shadow-md p-6 space-y-4 max-h-[600px] overflow-y-auto">
          <h2 className="text-lg font-bold text-green-700">Upcoming Events</h2>
          {loading ? (
            <div className="text-gray-500 text-sm">Loading upcoming events...</div>
          ) : (
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
          )}
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
                {getEventsForDate(selectedDate).map((ev, i) => (
                  <li
                    key={i}
                    className="border-l-4 border-green-600 pl-4 bg-green-50 p-3 rounded-md shadow-sm"
                  >
                    <p className="font-bold text-green-800">{ev.Title}</p>
                    <p className="text-sm text-gray-600">{ev.Description}</p>
                    <p className="text-xs text-gray-500">🕒 {ev.Time || 'N/A'}</p>
                  </li>
                ))}
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
