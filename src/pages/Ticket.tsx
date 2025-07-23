import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type TicketType = {
  ID: string;
  Title: string;
  Priority: string;
  Reason: string;
  Status: string;
  Timestamp: string;
};

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxJ460fW7M-OyARIkITeyjG90BVh5V1sVzStndHW2posqFx8M6UjUBGmJKp4wg3ZtU1/exec';

const Ticket = () => {
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTicket, setNewTicket] = useState({
    title: '',
    reason: '',
    priority: 'Low',
    status: 'pending',
  });

  // Load sheetId from localStorage
  useEffect(() => {
    const storedId = localStorage.getItem('spreadsheetId');
    if (!storedId) {
      alert('Missing spreadsheetId in localStorage');
      return;
    }
    setSheetId(storedId);
  }, []);

  // Fetch tickets on sheetId load
  useEffect(() => {
    if (sheetId) fetchTickets();
  }, [sheetId]);

  // Fetch all tickets
  const fetchTickets = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${SCRIPT_URL}?sheetId=${sheetId}&action=fetch`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      console.log('Fetched tickets:', data.data);

      // 🔁 Normalize keys from backend to match frontend TicketType
      const normalized = data.data.map((ticket: any) => ({
        ID: ticket.ID || '-',
        Title: ticket.TITLE || '-',
        Priority: ticket.PRIORITY || '-',
        Reason: ticket.REASON || '-',
        Status: ticket.STATUS || '-',
        Timestamp: ticket.TIMESTAMP|| '-',  // fallback for timestamp
      }));

      setTickets(normalized.reverse()); // Newest first
    } else {
      console.error('Fetch failed:', data.message);
      setTickets([]);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  } finally {
    setLoading(false);
  }
};


  // Submit new ticket
  const handleSubmit = async () => {
    const { title, reason, priority, status } = newTicket;
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
      status,
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
          status: 'pending',
        });
        fetchTickets();
      } else {
        alert('Submission failed: ' + data.message);
      }
    } catch (err) {
      console.error('Error submitting ticket:', err);
    }
  };

  return (
  <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
    <div className="w-full max-w-6xl grid gap-10">
      {/* New Ticket Form */}
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

      {/* Ticket List */}
      <div className="w-full bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-blue-100 text-gray-800 font-semibold">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Priority</th>
              <th className="p-4 text-left">Reason</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-center" colSpan={6}>
                  Loading...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td className="p-4 text-center" colSpan={6}>
                  No tickets found.
                </td>
              </tr>
            ) : (
              tickets.map((ticket, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-semibold text-blue-600">{ticket.ID || '-'}</td>
                  <td className="p-4">{ticket.Title || '-'}</td>
                  <td className="p-4">{ticket.Priority || '-'}</td>
                  <td className="p-4">{ticket.Reason || '-'}</td>
                  <td className="p-4">{ticket.Status || '-'}</td>
                  <td className="p-4">{ticket.Timestamp || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

};

export default Ticket;
