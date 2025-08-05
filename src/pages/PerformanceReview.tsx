import React, { useState, useRef, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, Bell, User, UserCircle } from 'lucide-react';
import RequireLogin from '@/components/ui/RequireLogin';

ChartJS.register(ArcElement, Tooltip, Legend);

const PerformanceReview = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [efficiency, setEfficiency] = useState(0);

  const pieLabels = ['Projects Completed', 'Collaboration', 'Efficiency', 'Drawbacks', 'Innovation'];
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pieData = {
    labels: pieLabels,
    datasets: [
      {
        data: [30, 25, 20, 15, 10],
        backgroundColor: ['#6366F1', '#60A5FA', '#10B981', '#F87171', '#FBBF24'],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 12,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setSelected(pieLabels[index]);
      }
    },
    plugins: {
      legend: { position: 'bottom' as const },
    },
  };

  useEffect(() => {
    let current = 0;
    const target = 92;
    const interval = setInterval(() => {
      current += 1;
      setEfficiency(current);
      if (current >= target) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, []);

  const renderDetails = () => {
    switch (selected) {
      case 'Projects Completed':
        return (
          <div className="animate-slide-in p-5 bg-white rounded-lg shadow border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-800 mb-2">🏗️ Projects Completed</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>CodeBlox Portal — Lead Developer</li>
              <li>Client App Integration — On-time delivery</li>
              <li>Automation Scripts — Boosted efficiency 35%</li>
              <li>Performance Review Dashboard</li>
              <li>Timesheet & Leave Management System</li>
              <li>Document Request Generator</li>
            </ul>
          </div>
        );
      case 'Collaboration':
        return (
          <div className="animate-slide-in p-5 bg-white rounded-lg shadow border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🤝 Collaboration</h3>
            <p className="text-gray-700">You worked with 4 cross-functional teams, actively participated in 12 sprint plannings, and mentored 2 junior developers.</p>
          </div>
        );
      case 'Efficiency':
        return (
          <div className="animate-slide-in p-5 bg-white rounded-lg shadow border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">⚡ Efficiency</h3>
            <p className="text-gray-700">Your average task completion rate is <strong>92%</strong>. Minimal backlog with consistent sprint delivery. You saved 18+ developer hours through optimizations.</p>
          </div>
        );
      case 'Drawbacks':
        return (
          <div className="animate-slide-in p-5 bg-white rounded-lg shadow border border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-2">🧩 Drawbacks</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Missed 1 client deadline due to scope creep</li>
              <li>Low participation in 2 retrospectives</li>
              <li>Documentation for API routes needs improvement</li>
            </ul>
          </div>
        );
      case 'Innovation':
        return (
          <div className="animate-slide-in p-5 bg-white rounded-lg shadow border border-yellow-300">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🚀 Innovation</h3>
            <p className="text-gray-700">You introduced a reusable component system that reduced UI bugs by 40%. Also proposed a CI/CD pipeline improvement that got approved for Q3.</p>
          </div>
        );
      default:
        return (
          <div className="text-gray-400 italic">Click a chart section to see details.</div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header like Requests page */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Performance Review</p>
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
            className="text-green-700 hover:bg-green-100 p-2 rounded-full transition"
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Pie Chart Section */}
          <div className="w-full lg:w-1/2 bg-white shadow-lg border rounded-lg p-6 hover:shadow-xl transition">
            <h2 className="text-lg font-semibold text-center text-gray-700 mb-3">Your Performance Summary</h2>
            <div className="h-[300px] w-full">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>

          {/* Details + Efficiency Section */}
          <div className="w-full lg:w-1/2 flex flex-col justify-between">
            <div>{renderDetails()}</div>

            {/* Efficiency Circle */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
              <h3 className="text-md font-semibold text-indigo-700 mb-4">⚡ Efficiency Score</h3>
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                    fill="none"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#4f46e5"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={Math.PI * 2 * 45}
                    strokeDashoffset={Math.PI * 2 * 45 * (1 - efficiency / 100)}
                    initial={{ strokeDashoffset: Math.PI * 2 * 45 }}
                    animate={{ strokeDashoffset: Math.PI * 2 * 45 * (1 - efficiency / 100) }}
                    transition={{ duration: 2 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-indigo-600">
                  {efficiency}%
                </div>
              </div>
              <p className="mt-2 text-gray-600 text-sm text-center">
                Efficiency based on sprint/task completion
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PerformanceReview;
