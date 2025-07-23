// src/pages/admin/AdminCalendar.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Bell, User, UserCircle } from 'lucide-react';

import {
  Calendar,
  dateFnsLocalizer,
  SlotInfo,
} from 'react-big-calendar';
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addHours,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type CustomEvent = {
  title: string;
  start: Date;
  end: Date;
  desc?: string;
};

const AdminCalendar = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<CustomEvent | null>(null);
  const [events, setEvents] = useState<CustomEvent[]>([
    {
      title: 'Interview Panel',
      start: new Date(),
      end: addHours(new Date(), 1),
      desc: 'Tech panel for frontend dev',
    },
    {
      title: 'Holiday Planning',
      start: addHours(new Date(), 24),
      end: addHours(new Date(), 25),
      desc: 'Finalize company holidays',
    },
    {
      title: 'Weekly Review',
      start: addHours(new Date(), 48),
      end: addHours(new Date(), 49),
      desc: 'Review performance metrics',
    },
  ]);

  const handleSelectEvent = (event: CustomEvent) => {
    setSelectedEvent(event);
  };

  const handleSlotSelect = (slotInfo: SlotInfo) => {
    const title = prompt('Enter event title:');
    const desc = prompt('Enter description (optional):');

    if (title) {
      const newEvent: CustomEvent = {
        title,
        start: slotInfo.start as Date,
        end: slotInfo.end as Date,
        desc: desc || '',
      };
      setEvents(prev => [...prev, newEvent]);
    }
  };

  return (
    <div className="p-0 m-0 bg-gray-50 w-full min-h-screen">

      <header className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center w-full min-h-[70px]">

        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Admin Calendar</p>
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

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100vh - 100px)', width: '100%', margin: 0, padding: 0 }}
        selectable
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSlotSelect}
        popup
        views={['month', 'week', 'day', 'agenda']}
        defaultView="month"
      />

      {selectedEvent && (
        <div className="mt-2 px-4 py-2 bg-white rounded-md shadow-sm border mx-4">

          <h2 className="text-xl font-semibold text-gray-800 mb-2">Event Details</h2>
          <p className="text-gray-600"><strong>Title:</strong> {selectedEvent.title}</p>
          {selectedEvent.desc && (
            <p className="text-gray-600"><strong>Description:</strong> {selectedEvent.desc}</p>
          )}
          <p className="text-gray-600"><strong>Start:</strong> {format(selectedEvent.start, 'PPpp')}</p>
          <p className="text-gray-600"><strong>End:</strong> {format(selectedEvent.end, 'PPpp')}</p>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;
