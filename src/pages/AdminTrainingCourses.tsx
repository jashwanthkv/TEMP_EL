import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Home, Bell, User, UserCircle } from 'lucide-react';


type Course = {
  id: string;
  title: string;
  platform: string;
  link: string;
};

type Enrollment = {
  employee: string;
  courseId: string;
  progress: number;
};

const AdminTrainingCourses = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [newCourse, setNewCourse] = useState({ title: '', platform: '', link: '' });

  const [courses, setCourses] = useState<Course[]>([
    { id: '1', title: 'React Advanced', platform: 'Udemy', link: '#' },
    { id: '2', title: 'TypeScript Mastery', platform: 'Coursera', link: '#' },
    { id: '3', title: 'Google Apps Script', platform: 'Pluralsight', link: '#' },
    { id: '4', title: 'Tailwind CSS Deep Dive', platform: 'YouTube', link: '#' },
  ]);

  const [enrollments] = useState<Enrollment[]>([
    { employee: 'Alice', courseId: '1', progress: 80 },
    { employee: 'Bob', courseId: '2', progress: 65 },
    { employee: 'Charlie', courseId: '1', progress: 40 },
    { employee: 'Diana', courseId: '3', progress: 90 },
  ]);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCourse = () => {
    if (newCourse.title && newCourse.platform && newCourse.link) {
      const newId = `${courses.length + 1}`;
      setCourses(prev => [...prev, { ...newCourse, id: newId }]);
      setNewCourse({ title: '', platform: '', link: '' });
    }
  };

  return (
    <div className="p-0 m-0 bg-gray-50 min-h-screen w-full">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center w-full min-h-[70px]">

        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Training & Courses</p>
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

      {/* Search */}
      <div className="mb-2 px-4">

        <input
          type="text"
          placeholder="Search course by name or platform..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Add Course Section */}
      <div className="bg-white px-4 py-3 rounded-md shadow-sm border mb-6 mx-4">

        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Plus className="h-5 w-5 text-green-600" /> Add New Course
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Course Title"
            value={newCourse.title}
            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
            className="p-3 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Platform"
            value={newCourse.platform}
            onChange={(e) => setNewCourse({ ...newCourse, platform: e.target.value })}
            className="p-3 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Course Link"
            value={newCourse.link}
            onChange={(e) => setNewCourse({ ...newCourse, link: e.target.value })}
            className="p-3 border border-gray-300 rounded"
          />
        </div>
        <button
          onClick={handleAddCourse}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Add Course
        </button>
      </div>

      {/* Available Courses */}
      <h2 className="text-lg font-bold text-gray-700 mb-2 px-4">Available Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 mb-6">

        {filteredCourses.map(course => (
          <div key={course.id} className="bg-white p-6 rounded shadow-md border hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{course.title}</h3>
            <p className="text-gray-600 mb-2">Platform: {course.platform}</p>
            <button
              onClick={() => window.open(course.link, '_blank')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              View Course
            </button>
          </div>
        ))}
      </div>

      {/* Employee Enrollments */}
      <h2 className="text-xl font-semibold text-gray-700 mb-4"> Employee Enrollments</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-6">

        {enrollments.map((enrollment, idx) => {
          const course = courses.find(c => c.id === enrollment.courseId);
          if (!course) return null;
          return (
            <div key={idx} className="bg-white p-6 rounded shadow-md border flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{course.title}</h3>
                <p className="text-gray-600 mb-2">
                  Platform: {course.platform} | Employee: <strong>{enrollment.employee}</strong>
                </p>
              </div>
              {/* Progress Circle */}
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#10b981"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={282.6}
                    strokeDashoffset={282.6 - (282.6 * enrollment.progress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-green-600 font-bold text-sm">
                  {enrollment.progress}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTrainingCourses;
