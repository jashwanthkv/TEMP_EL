import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Bell, User, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

type Employee = {
  id: string;
  name: string;
  hours: number;
  projects: number;
  performance: number;
  designation: string;
};

type MonthlyData = Record<string, Employee[]>;
type YearlyData = Record<string, MonthlyData>;

const allData: YearlyData = {
  '2025': {
    'July': [
      { id: 'EMP123', name: 'Sridhar', designation: 'Software Engineer', hours: 180, projects: 5, performance: 92 },
      { id: 'EMP456', name: 'Anita', designation: 'UI Designer', hours: 170, projects: 4, performance: 85 },
      { id: 'EMP789', name: 'Ravi', designation: 'QA Analyst', hours: 160, projects: 3, performance: 78 },
    ],
    'June': [
      { id: 'EMP123', name: 'Sridhar', designation: 'Software Engineer', hours: 175, projects: 4, performance: 88 },
      { id: 'EMP456', name: 'Anita', designation: 'UI Designer', hours: 168, projects: 4, performance: 82 },
      { id: 'EMP789', name: 'Ravi', designation: 'QA Analyst', hours: 155, projects: 2, performance: 70 },
    ]
  },
  '2024': {
    'July': [
      { id: 'EMP123', name: 'Sridhar', designation: 'Software Engineer', hours: 165, projects: 3, performance: 80 },
      { id: 'EMP456', name: 'Anita', designation: 'UI Designer', hours: 160, projects: 3, performance: 78 },
      { id: 'EMP789', name: 'Ravi', designation: 'QA Analyst', hours: 150, projects: 2, performance: 75 },
    ]
  }
};

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('July');
  const [chartData, setChartData] = useState<Employee[]>([]);
  const [employeeOfMonth, setEmployeeOfMonth] = useState<Employee | null>(null);
  const [employeeOfYear, setEmployeeOfYear] = useState<Employee | null>(null);

  useEffect(() => {
    const monthlyData = allData[selectedYear]?.[selectedMonth] || [];
    setChartData(monthlyData);

    if (monthlyData.length > 0) {
      const topMonthly = [...monthlyData].sort((a, b) => b.performance - a.performance)[0];
      setEmployeeOfMonth(topMonthly);
    } else {
      setEmployeeOfMonth(null);
    }

    const yearlyData = allData[selectedYear];
    if (yearlyData) {
      const aggregate: Record<string, { total: number; count: number; employee: Employee }> = {};

      Object.values(yearlyData).forEach((month) => {
        month.forEach((emp) => {
          if (!aggregate[emp.id]) {
            aggregate[emp.id] = {
              total: emp.performance,
              count: 1,
              employee: emp
            };
          } else {
            aggregate[emp.id].total += emp.performance;
            aggregate[emp.id].count += 1;
          }
        });
      });

      const topYear = Object.values(aggregate)
        .map(({ total, count, employee }) => ({
          avg: total / count,
          employee
        }))
        .sort((a, b) => b.avg - a.avg)[0];

      setEmployeeOfYear(topYear?.employee || null);
    } else {
      setEmployeeOfYear(null);
    }
  }, [selectedYear, selectedMonth]);

  return (
    <div className="bg-gray-50 w-full min-h-screen p-0 m-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <img src="/logos.png" alt="Logo" className="h-8 w-auto object-contain" />
          <div>
            <p className="text-base font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-sm font-semibold text-gray-600">Admin Analytics</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-base font-bold text-green-700">EMPWR</span>

          <button
  onClick={() => navigate('/notifications')}
  className="relative text-green-800 hover:text-green-900"
>
  <Bell className="h-5 w-5" />
</button>


          <div className="relative group">
            <button className="w-9 h-9 flex items-center justify-center hover:bg-green-100 rounded-full">
              <User className="w-4 h-4 text-green-700" />
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white shadow-lg rounded-md opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transition-all duration-200 z-50">
              <button
                onClick={() => navigate('/profile')}
                className="w-full px-3 py-2 text-left text-gray-800 hover:bg-green-50 flex items-center gap-2"
              >
                <UserCircle className="w-4 h-4 text-green-600" />
                View Profile
              </button>
            </div>
          </div>

          <button onClick={() => navigate('/admin')} className="text-green-700 hover:bg-green-100 p-2 rounded-full transition">
            <Home className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 px-4 py-3">
        <select
          className="border rounded-md px-3 py-1 text-sm"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {['January', 'February', 'March', 'April', 'May', 'June', 'July'].map(month => (
            <option key={month}>{month}</option>
          ))}
        </select>
        <select
          className="border rounded-md px-3 py-1 text-sm"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {Object.keys(allData).map(year => (
            <option key={year}>{year}</option>
          ))}
        </select>
        <Button className="bg-blue-600 text-white text-sm px-4 py-1 hover:bg-blue-700">Export PDF</Button>
        <Button className="bg-green-600 text-white text-sm px-4 py-1 hover:bg-green-700">Export Excel</Button>
      </div>

      {/* Bar Chart */}
      <div className="px-4 pb-4">
        <Card className="shadow-sm border">
          <CardContent className="p-4">
            <h3 className="text-base font-semibold mb-3">
              Employee of the Month:{' '}
              <span className="text-blue-700">
                {employeeOfMonth
                  ? `${employeeOfMonth.name} (${employeeOfMonth.id}) — ${employeeOfMonth.designation}`
                  : 'N/A'}
              </span>
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="#8884d8" name="Working Hours" />
                <Bar dataKey="projects" fill="#82ca9d" name="Projects Completed" />
                <Bar dataKey="performance" fill="#ffc658" name="Performance Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Employee of the Year */}
      <div className="px-4 pb-4">
        <Card className="shadow-sm border">
          <CardContent className="p-4">
            <h3 className="text-base font-semibold">
              Employee of the Year {selectedYear}:{' '}
              <span className="text-green-700">
                {employeeOfYear
                  ? `${employeeOfYear.name} (${employeeOfYear.id}) — ${employeeOfYear.designation}`
                  : 'N/A'}
              </span>
            </h3>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
