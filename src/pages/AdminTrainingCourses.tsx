import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Bell, Home, User, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    { employee: 'Diana', courseId: '3', progress: 100 },
  ]);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCourse = () => {
    if (newCourse.title && newCourse.platform && newCourse.link) {
      const newId = `${Date.now()}`;
      setCourses(prev => [...prev, { ...newCourse, id: newId }]);
      setNewCourse({ title: '', platform: '', link: '' });
    }
  };

  const handleRemoveCourse = (id: string) => {
    setCourses(prev => prev.filter(course => course.id !== id));
  };

  return (
    <div className="p-0 m-0 bg-gray-50 min-h-screen w-full">
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

      {/* Search */}
      <div className="flex justify-center mb-4 mt-4">
        <input
          type="text"
          placeholder="Search course by name or platform..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[400px] p-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Add Course */}
      <div className="bg-white px-4 py-3 rounded-lg shadow-sm border mb-6 mx-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Plus className="h-5 w-5 text-green-600" /> Add New Course
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Course Title"
            value={newCourse.title}
            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
            className="p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="Platform"
            value={newCourse.platform}
            onChange={(e) => setNewCourse({ ...newCourse, platform: e.target.value })}
            className="p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="Course Link"
            value={newCourse.link}
            onChange={(e) => setNewCourse({ ...newCourse, link: e.target.value })}
            className="p-3 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          onClick={handleAddCourse}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Add Course
        </button>
      </div>

      {/* Course List */}
      <h2 className="text-lg font-bold text-gray-700 mb-2 px-4">Added Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 mb-6">
        {filteredCourses.map(course => (
          <div key={course.id} className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{course.title}</h3>
            <p className="text-gray-600 mb-2">Platform: {course.platform}</p>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(course.link, '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                View Course
              </button>
              <button
                onClick={() => handleRemoveCourse(course.id)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enrollments */}
      <div className="px-4 pb-10">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Employee Enrollments</h2>

        {/* Enrolled Courses Table */}
        <h3 className="text-lg font-semibold text-green-700 mb-3">Employees Enrolled</h3>
        <div className="overflow-x-auto rounded-lg shadow mb-6">
          <table className="min-w-full bg-white border border-gray-200 text-sm">
            <thead className="bg-green-100 text-gray-800">
              <tr>
                <th className="px-4 py-3 text-left">Employee ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Enrollment Date</th>
              </tr>
            </thead>
            <tbody>
              {enrollments
                .filter((e) => e.progress < 100)
                .map((enroll, idx) => {
                  const course = courses.find((c) => c.id === enroll.courseId);
                  if (!course) return null;

                  return (
                    <tr key={idx} className="border-t border-gray-200">
                      <td className="px-4 py-3">EMP{1000 + idx}</td>
                      <td className="px-4 py-3">{enroll.employee}</td>
                      <td className="px-4 py-3">{course.title}</td>
                      <td className="px-4 py-3 text-yellow-600 font-medium">Enrolled</td>
                      <td className="px-4 py-3">{new Date().toLocaleDateString()}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Completed Courses Table */}
        <h3 className="text-lg font-semibold text-green-700 mt-8 mb-3">Courses Completed</h3>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white border border-gray-200 text-sm">
            <thead className="bg-green-100 text-gray-800">
              <tr>
                <th className="px-4 py-3 text-left">Employee ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Completion Date</th>
              </tr>
            </thead>
            <tbody>
              {enrollments
                .filter((e) => e.progress === 100)
                .map((enroll, idx) => {
                  const course = courses.find((c) => c.id === enroll.courseId);
                  if (!course) return null;

                  return (
                    <tr key={idx} className="border-t border-gray-200">
                      <td className="px-4 py-3">EMP{1000 + idx}</td>
                      <td className="px-4 py-3">{enroll.employee}</td>
                      <td className="px-4 py-3">{course.title}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">Completed</td>
                      <td className="px-4 py-3">{new Date().toLocaleDateString()}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTrainingCourses;
