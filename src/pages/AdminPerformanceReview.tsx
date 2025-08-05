import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Bell, User, UserCircle } from 'lucide-react';
import RequireLogin from '@/components/ui/RequireLogin';


ChartJS.register(ArcElement, Tooltip, Legend);

type Employee = {
  id: string;
  name: string;
  efficiency: number;
  performanceData: number[]; // [Projects, Collaboration, Efficiency, Drawbacks, Innovation]
};

const mockEmployees: Employee[] = [
  {
    id: 'EMP001',
    name: 'Sridhar K',
    efficiency: 92,
    performanceData: [30, 25, 20, 15, 10],
  },
  {
    id: 'EMP002',
    name: 'Asha R',
    efficiency: 85,
    performanceData: [25, 30, 15, 20, 10],
  },
  {
    id: 'EMP003',
    name: 'Manoj S',
    efficiency: 78,
    performanceData: [20, 20, 18, 25, 17],
  },
];

const AdminPerformanceReview = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  const navigate = useNavigate();
  const pieLabels = ['Projects Completed', 'Collaboration', 'Efficiency', 'Drawbacks', 'Innovation'];

  const [selectedEmployee, setSelectedEmployee] = useState<Employee>(mockEmployees[0]);
  const [selected, setSelected] = useState<string | null>(null);
  const [efficiency, setEfficiency] = useState(0);

  useEffect(() => {
    let current = 0;
    const target = selectedEmployee.efficiency;
    const interval = setInterval(() => {
      current += 1;
      setEfficiency(current);
      if (current >= target) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [selectedEmployee]);

  const pieData = {
    labels: pieLabels,
    datasets: [
      {
        data: selectedEmployee.performanceData,
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

  const renderDetails = () => {
    switch (selected) {
      case 'Projects Completed':
        return (
          <div className="animate-slide-in p-5 bg-white rounded-lg shadow border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-800 mb-2">🏗️ Projects Completed</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Successfully delivered major features</li>
              <li>Led 2 sprints</li>
              <li>Optimized core modules</li>
            </ul>
          </div>
        );
      case 'Collaboration':
        return (
          <div className="animate-slide-in p-5 bg-white rounded-lg shadow border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🤝 Collaboration</h3>
            <p className="text-gray-700">Participated in team standups, code reviews, and mentoring.</p>
          </div>
        );
      case 'Efficiency':
        return (
          <div className="animate-slide-in p-5 bg-white rounded-lg shadow border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">⚡ Efficiency</h3>
            <p className="text-gray-700">Average completion rate: <strong>{selectedEmployee.efficiency}%</strong></p>
          </div>
        );
      case 'Drawbacks':
        return (
          <div className="animate-slide-in p-5 bg-white rounded-lg shadow border border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-2">🧩 Drawbacks</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Missed 1 retrospective</li>
              <li>Some delays in task submissions</li>
            </ul>
          </div>
        );
      case 'Innovation':
        return (
          <div className="animate-slide-in p-5 bg-white rounded-lg shadow border border-yellow-300">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🚀 Innovation</h3>
            <p className="text-gray-700">Suggested UI optimizations and automated repetitive tasks.</p>
          </div>
        );
      default:
        return <div className="text-gray-400 italic">Click a chart section to see details.</div>;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="w-screen bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Performance review</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <span className="text-lg font-bold text-green-700">EMPWR</span>

          <button
                            onClick={() => navigate('/admin/notifications')}
                            className="relative text-green-800 hover:text-green-900"
                          >
                            <Bell className="h-5 w-5" />
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

          <button
            onClick={() => navigate('/admin')}
            className="text-green-700 hover:bg-green-100 p-2 rounded-full transition"
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>


      {/* Employee Selector */}
      <div className="mb-6">
        <label className="block mb-2 text-gray-700 font-medium">Select Employee:</label>
        <select
          className="w-full p-3 border rounded"
          value={selectedEmployee.id}
          onChange={(e) => {
            const emp = mockEmployees.find(emp => emp.id === e.target.value);
            if (emp) {
              setSelectedEmployee(emp);
              setSelected(null);
              setEfficiency(0); // reset efficiency for animation
            }
          }}
        >
          {mockEmployees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Pie Chart Section */}
        <div className="w-full lg:w-1/2 bg-white shadow-lg border rounded-lg p-6 hover:shadow-xl transition">
          <h2 className="text-lg font-semibold text-center text-gray-700 mb-3">
            {selectedEmployee.name}'s Performance Summary
          </h2>
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
    </div>
  );
};

export default AdminPerformanceReview;
