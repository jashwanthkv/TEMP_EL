import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { sendRequest } from '@/lib/api';

interface Request {
  id: string;
  empId: string;
  empName: string;
  empMail: string;
  project: string;
  task: string;
  startTime: string;
  date: string;
}

const TimesheetAdmin = () => {
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [activeTimers, setActiveTimers] = useState<{ [key: string]: number }>({});
  const [startTimes, setStartTimes] = useState<{ [key: string]: Date }>({});
  const [fileUrls, setFileUrls] = useState<{ [key: string]: string }>({});
  const timerRefs = useRef<{ [key: string]: NodeJS.Timeout }>({}); // ✅ store setInterval refs

  useEffect(() => {
    fetchPending();
    return () => {
      // Clear all intervals on unmount
      Object.values(timerRefs.current).forEach(clearInterval);
    };
  }, []);

  const fetchPending = async () => {
    const res = await sendRequest({ action: "getPendingTimesheets" });
    if (res.success) {
      setPendingRequests(res.data || []);
    }
  };

  const startTimer = (id: string, startTimeStr: string) => {
    const start = new Date();
    const parts = startTimeStr.split(':');
    start.setHours(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
    setStartTimes(prev => ({ ...prev, [id]: start }));

    setActiveTimers(prev => ({ ...prev, [id]: 0 }));
    const interval = setInterval(() => {
      setActiveTimers(prev => ({
        ...prev,
        [id]: (prev[id] || 0) + 1
      }));
    }, 1000);

    timerRefs.current[id] = interval; // ✅ save timer
  };

  const stopTimer = (id: string) => {
    if (timerRefs.current[id]) {
      clearInterval(timerRefs.current[id]);
      delete timerRefs.current[id];
    }

    setStartTimes(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    setActiveTimers(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleSubmit = async (req: Request) => {
    const workedSeconds = activeTimers[req.id] || 0;
    const end = new Date();
    const endTime = end.toLocaleTimeString('en-GB');

    const res = await sendRequest({
      action: "approveTimesheet",
      id: req.id,
      empId: req.empId,
      empName: req.empName,
      empMail: req.empMail,
      project: req.project,
      task: req.task,
      startTime: req.startTime,
      endTime,
      workedSeconds,
      breaks: 0,
      fileUrl: fileUrls[req.id] || '',
      status: "Approved",
      date: req.date,
    });

    if (res.success) {
      alert("✅ Approved timesheet!");
      stopTimer(req.id);
      fetchPending();
    } else {
      alert("❌ Failed to approve timesheet.");
    }
  };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Pending Timesheet Check</h1>

      {pendingRequests.length === 0 ? (
        <p className="text-gray-500">No pending timesheets.</p>
      ) : (
        <div className="space-y-6">
          {pendingRequests.map((req) => (
            <Card key={req.id}>
              <CardHeader>
                <CardTitle>
                  {req.empName} → <span className="text-sm font-normal">{req.project}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p><strong>Task:</strong> {req.task}</p>
                <p><strong>Date:</strong> {req.date}</p>
                <p><strong>Start Time:</strong> {req.startTime}</p>
                <p><strong>Timer:</strong> {formatTime(activeTimers[req.id] || 0)}</p>

                <input
                  type="text"
                  className="w-full border rounded p-2"
                  placeholder="File URL (optional)"
                  value={fileUrls[req.id] || ''}
                  onChange={(e) =>
                    setFileUrls((prev) => ({ ...prev, [req.id]: e.target.value }))
                  }
                />

                <div className="flex gap-4 mt-3">
                  {!activeTimers[req.id] ? (
                    <Button onClick={() => startTimer(req.id, req.startTime)}>
                      Start Timer
                    </Button>
                  ) : (
                    <Button onClick={() => handleSubmit(req)} className="bg-blue-600 text-white">
                      Submit Timesheet
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      stopTimer(req.id);
                      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
                    }}
                  >
                    Cancel / Hide
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimesheetAdmin;
