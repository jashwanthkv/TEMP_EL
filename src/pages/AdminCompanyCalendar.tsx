export function jsonpRequest(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = "jsonp_callback_" + Math.round(100000 * Math.random());
    (window as any)[callbackName] = (data: any) => {
      resolve(data);
      delete (window as any)[callbackName];
      document.body.removeChild(script);
    };
    const script = document.createElement("script");
    script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + callbackName;
    script.onerror = () => {
      reject(new Error("JSONP request failed"));
      delete (window as any)[callbackName];
      document.body.removeChild(script);
    };
    document.body.appendChild(script);
  });
}

import React, { useState, useRef, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  parse,
} from 'date-fns';
import { Home, Bell, User, UserCircle, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Event {
  eventId?: number; 
  Title: string;
  Date: string; // Format: 'dd/MM/yyyy'
  Description: string;
  StartTime: string; // Format: 'HH:mm'
}

const BACK_URL="https://script.google.com/macros/s/AKfycby4mIl3BeOq_YW0E5Q_eSMCvZkKl0VWHnGBkD524zyN0BS-F9NnqeNdShxbgJtez9tjvw/exec";
const back="https://script.google.com/macros/s/AKfycbwwzbb80PQYMI_Ub_3AUWRx9K9WP94wpySZWUFzv6XD7UefJxAoHDvd-Mv346HWUSgfkg/exec";
const CompanyCalendar: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({});
  const [isEditing, setIsEditing] = useState(false);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  
    // Close on outside click
    React.useEffect(() => {
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
    return new Date(year, month - 1, day);
  };

  const getEventForDate = (date: Date) =>
    events.filter((e) => {
      const eventDate = parseDate(e.Date);
      return eventDate && isSameDay(eventDate, date);
    });

  const handleDateSClick = (date: Date) => {
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
      const res = await fetch(`${BACK_URL}?action=upcoming`);
      const data = await res.json();
      console.log("Fetched events:", data.events);

      const mappedEvents = (data.events || []).map((ev: any) => ({
        ...ev,
        StartTime: ev.Time, // ✅ Required remapping for frontend compatibility
      }));

      setEvents(mappedEvents);
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


  const getBoxsColor = (count: number) => {
    if (count === 0) return 'bg-white';
    if (count === 1) return 'bg-green-100';
    if (count === 2) return 'bg-orange-200';
    return 'bg-red-300';
  };

  const starts = startOfWeek(startOfMonth(today), { weekStartsOn: 1 });
  const ends = endOfWeek(endOfMonth(today), { weekStartsOn: 1 });
  const day: Date[] = [];
  for (let d = starts; d <= ends; d = addDays(d, 1)) {
    day.push(d);
  }

  const formatDate = (date: Date): string => format(date, 'dd/MM/yyyy');

  const getEventsForDate = (date: Date) =>
    events.filter((e) => isSameDay(parseDate(e.Date) || new Date(), date));

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const handleAddOrEditEvent = async () => {
  if (
    !newEvent.Title ||
    !newEvent.Date ||
    !newEvent.Description ||
    !newEvent.StartTime
  ) {
    alert("All fields are required.");
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append("action", isEditing ? "editEvent" : "addEvent");
    params.append("title", newEvent.Title.trim());
    params.append("date", newEvent.Date.trim());
    params.append("start", newEvent.StartTime.trim());
    params.append("description", newEvent.Description.trim());

    if (isEditing && newEvent.eventId) {
      params.append("eventId", newEvent.eventId.toString());
    }

    const url = `https://script.google.com/macros/s/AKfycbwwzbb80PQYMI_Ub_3AUWRx9K9WP94wpySZWUFzv6XD7UefJxAoHDvd-Mv346HWUSgfkg/exec?${params.toString()}`;

    const result = await jsonpRequest(url);
    console.log(result);

    if (result.status === "success") {
      const createdEvent: Event = {
        ...(newEvent as Event),
        eventId: result.eventId ?? newEvent.eventId,
      };

      if (isEditing && createdEvent.eventId) {
        const updated = events.map(ev =>
          ev.eventId === createdEvent.eventId ? createdEvent : ev
        );
        setEvents(updated);
      }
      else {
        setEvents([...events, createdEvent]);
      }

      setShowAddForm(false);
      setNewEvent({});
      setIsEditing(false);
    } else {
      alert("Error: " + result.message);
    }
  } catch (err) {
    console.error("Error adding event:", err);
    alert("An error occurred while adding the event.");
  }
};




  const handleDeleteEvent = async (target: Event) => {
  if (!target.eventId) {
    alert("Missing eventId for deletion.");
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append("action", "deleteEvent");
    params.append("eventId", target.eventId.toString());

    const url = `https://script.google.com/macros/s/AKfycbwwzbb80PQYMI_Ub_3AUWRx9K9WP94wpySZWUFzv6XD7UefJxAoHDvd-Mv346HWUSgfkg/exec?${params.toString()}`;

    const result = await jsonpRequest(url);

    if (result.status === "success") {
      alert("Event deleted.");
      setEvents(events.filter((e) => e.eventId !== target.eventId));
    } else {
      alert("Failed to delete: " + result.message);
    }
  } catch (err) {
    console.error("Delete failed", err);
    alert("Delete failed.");
  }
};




  const handleEditEvent = (event: Event) => {
  setNewEvent(event);
  setIsEditing(true);
  setShowAddForm(true);
};


  const days: Date[] = [];
  const start = startOfWeek(startOfMonth(today), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(today), { weekStartsOn: 1 });
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  const getBoxColor = (count: number) => {
    if (count === 0) return 'bg-white';
    if (count === 1) return 'bg-green-100';
    if (count === 2) return 'bg-yellow-200';
    return 'bg-red-200';
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-white to-gray-100">

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
                          navigate('/admin/profile');
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
                  onClick={() => navigate('/admin')}
                  className="w-10 h-10 flex items-center justify-center text-green-700 hover:bg-green-100 rounded-full"
                  aria-label="Dashboard"
                >
                  <Home className="w-5 h-5" />
                </button>
              </div>
            </header>

      {/* Calendar View */}
      <main className="max-w-[1400px] mx-auto px-4 pt-4 pb-0 flex flex-row gap-4 h-[calc(100vh-80px)] overflow-hidden relative">
        {/* ✅ Loading Overlay for Body Only (excludes header) */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-60 z-40 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

  {/* Upcoming Events - Left */}
  <div className="bg-white rounded-xl shadow p-4 w-[300px] h-full overflow-y-auto">
    <h2 className="text-base font-bold text-green-700 mb-2">Upcoming Events</h2>
    {events.length === 0 ? (
      <p className="text-sm text-gray-500">No upcoming events added.</p>
    ) : (
      <ul className="space-y-2">
        {events
          .filter(ev => parseDate(ev.Date)! >= today)
          .sort((a, b) => (parseDate(a.Date)?.getTime() || 0) - (parseDate(b.Date)?.getTime() || 0))
          .map((ev, idx) => (
            <li key={idx} className="bg-green-50 p-2 rounded-md shadow-sm text-sm">
              <p className="font-semibold text-green-800">{ev.Title}</p>
              <p className="text-xs text-gray-600">{ev.Date}</p>
            </li>
          ))}
      </ul>
    )}
  </div>

  {/* Calendar - Right */}
  <div className="bg-white rounded-xl shadow p-4 flex-1 h-full flex flex-col overflow-hidden">
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-green-700 font-semibold text-base">Monthly Overview</h2>
      <button
        onClick={() => {
          setNewEvent({ Date: formatDate(today) });
          setShowAddForm(true);
        }}
        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-md shadow flex items-center gap-1"
      >
        <PlusCircle className="w-4 h-4" /> Add Event
      </button>
    </div>
    <div className="grid grid-cols-7 gap-px text-center flex-1 overflow-y-auto text-xs">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
        <div key={day} className="bg-slate-50 py-1 font-semibold text-gray-600">{day}</div>
      ))}
      {days.map((day, i) => {
        const count = getEventsForDate(day).length;
        const isToday = isSameDay(day, today);
        return (
          <div
            key={i}
            onClick={() => handleDateClick(day)}
            className={`h-24 p-1 border ${getBoxColor(count)} ${isToday ? 'border-2 border-green-500' : ''} cursor-pointer flex flex-col justify-center items-center relative`}
          >
            <div className="absolute top-1 right-1 text-[10px] text-gray-600">{format(day, 'd')}</div>
            {count > 0 && (
              <div className="font-medium text-[11px] text-gray-800">{count} {count > 1 ? 'events' : 'event'}</div>
            )}
          </div>
        );
      })}
    </div>
  </div>
</main>


      {/* Modal for Day Click */}
      {modalOpen && selectedDate && (
        <div onClick={() => setModalOpen(false)} className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-xl max-w-md w-full shadow-xl relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-2 right-4 text-gray-600 hover:text-black text-xl">×</button>
            <h3 className="text-lg font-bold text-green-700 mb-4">
              Events on {format(selectedDate, 'EEE, dd MMM yyyy')}
            </h3>
            {getEventsForDate(selectedDate).length > 0 ? (
              <ul className="space-y-4">
                {getEventsForDate(selectedDate).map((ev, i) => (
                  <li key={i} className="border-l-4 border-green-600 pl-4 bg-green-50 p-3 rounded-md shadow-sm flex justify-between items-start">
                    <div>
                      <p className="font-bold text-green-800">{ev.Title}</p>
                      <p className="text-sm text-gray-600">{ev.Description}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        🕒 {(() => {
  const raw = ev.StartTime?.toString();

  // Case 1: Legacy Date string like "Sat Dec 30 1899 13:00:00 GMT+0521 ..."
  if (raw?.includes("1899")) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return format(d, 'hh:mm a');  // ✅ formatted
    }
  }

  // Case 2: "13:00" format
  const [h, m] = raw?.split(':') || [];
  if (h && m) {
    const parsed = parse(`${h}:${m}`, 'HH:mm', new Date());
    return !isNaN(parsed.getTime()) ? format(parsed, 'hh:mm a') : 'No Time';
  }

  return 'No Time';
})()}


                      </p>



                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditEvent(ev)} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                      <button onClick={() => handleDeleteEvent(ev)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>

            ) : (
              <p className="text-gray-500">No events scheduled for this date.</p>
            )}
          </div>
        </div>
      )}


      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl">
            <h3 className="text-lg font-bold text-green-700 mb-4">{isEditing ? 'Edit Event' : 'Add New Event'}</h3>
            <input
              type="text"
              placeholder="Title"
              value={newEvent.Title || ''}
              onChange={(e) => setNewEvent({ ...newEvent, Title: e.target.value })}
              className="w-full mb-3 px-3 py-2 border rounded"
            />
            <input
              type="date"
              value={
                newEvent.Date
                  ? format(parse(newEvent.Date, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd')
                  : ''
              }
              onChange={(e) =>
                setNewEvent({
                  ...newEvent,
                  Date: format(parse(e.target.value, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy'),
                })
              }
              className="w-full mb-3 px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Description"
              value={newEvent.Description || ''}
              onChange={(e) => setNewEvent({ ...newEvent, Description: e.target.value })}
              className="w-full mb-3 px-3 py-2 border rounded"
            />
            <input
  type="time"
  value={(() => {
    const raw = newEvent.StartTime?.toString() || '';
    if (raw.includes('1899')) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
    }
    // If it's already in HH:mm, return directly
    if (/^\d{1,2}:\d{2}$/.test(raw)) return raw;
    return '';
  })()}
  onChange={(e) =>
    setNewEvent({ ...newEvent, StartTime: e.target.value })
  }
  className="w-full mb-3 px-3 py-2 border rounded"
  required
/>

            
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowAddForm(false); setNewEvent({}); setIsEditing(false); }} className="px-4 py-2 text-sm rounded border">Cancel</button>
              <button onClick={handleAddOrEditEvent} className="px-4 py-2 text-sm bg-green-600 text-white rounded">{isEditing ? 'Update' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyCalendar;
