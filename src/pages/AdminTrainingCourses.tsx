import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Bell, Home, User, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RequireLogin from '@/components/ui/RequireLogin';

type Course = {
  name: string;
  platform: string;
  link: string;
  topic: string;
  deadline: string;
};

type Enrollment = {
  id: string,
  employee: string;
  courseId: string;
  progress: number;
};

const AdminTrainingCourses = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [newCourse, setNewCourse] = useState({ 
    name: '', 
    platform: '', 
    link: '', 
    topic: '', 
    deadline: '' 
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [notYetCourses, setNotYetCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
 



  const navigates = useNavigate();

  const scriptURL =
    'https://script.google.com/macros/s/AKfycbxT1iQ-XtCHk5_cfkicpXTO4NPnei4pAEZbc75rPSLwsDRy5kv6VLFZTb9IwAexGu620g/exec';

  useEffect(() => {
  fetch(`${scriptURL}?action=getCourses`)
    .then((res) => res.json())
    .then((data) => {
  setCourses(data || []);
  setNotYetCourses(data || []);
})
    .then(() => setLoading(false))

    .catch((err) => console.error('Error fetching course list:', err));
}, []);



  const updateStatus = async (course: Course, status: 'enrolled' | 'completed') => {
    const sheetId = localStorage.getItem("spreadsheetId");
    if (!sheetId) {
      console.error("Sheet ID not found in localStorage");
      return;
    }

    const params = new URLSearchParams({
      name: course.name,
      status: status,
      sheetId: sheetId,
    });

    try {
      await fetch(`${scriptURL}?${params.toString()}`, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Failed to update course status:', error);
    }
  };

  const handleEnroll = (course: Course) => {
    updateStatus(course, 'enrolled');
    setEnrolledCourses((prev) => [...prev, course]);
    setNotYetCourses((prev) => prev.filter((c) => c.name !== course.name));
  };
  const filteredCourse = notYetCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.platform.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    fetch(`${scriptURL}?action=courseStatus`)
      .then((res) => res.json())
      .then((data) => {
        const list: Enrollment[] = [];
        data.forEach((course: any) => {
          course.enrolled.forEach((emp: any) =>
            list.push({ id: emp.id, employee: emp.name, courseId: course.courseName, progress: 50 })
          );
          course.completed.forEach((emp: any) =>
            list.push({ id: emp.id, employee: emp.name, courseId: course.courseName, progress: 100 })
          );

        });
        setEnrollments(list);
      })
      .catch((err) => console.error('Failed to fetch course status', err));
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    

  }, []);
  

  const [courses, setCourses] = useState<Course[]>([
    
  ]);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  console.log('notYetCourses:', notYetCourses);
  console.log('enrolledCourses:', enrolledCourses);
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCourse = async () => {
  const { name, platform, link, topic, deadline } = newCourse;
  if (!name || !platform || !link || !topic || !deadline) return;

  const params = new URLSearchParams({
    action: 'addCourse',
    name,
    platform,
    link,
    topic,
    deadline,
  });

  try {
    const res = await fetch(`${scriptURL}?${params.toString()}`);
    const data = await res.json();
    if (data.status === 'success') {
      setCourses((prev) => [...prev, newCourse]);
      setNewCourse({ name: '', platform: '', link: '', topic: '', deadline: '' });
      alert('Course added successfully!');
    }
  } catch (err) {
    console.error('Error adding course:', err);
  }
};

const handleRemoveCourse = async (name: string) => {
  if (!window.confirm(`Are you sure you want to remove the course "${name}"?`)) return;

  const params = new URLSearchParams({
    action: 'removeCourse',
    name,
  });

  try {
    await fetch(`${scriptURL}?${params.toString()}`);
    setCourses(prev => prev.filter(course => course.name !== name));
  } catch (err) {
    console.error("Failed to remove course:", err);
  }
};



  return (
    
    <div className="p-0 m-0 bg-gray-50 min-h-screen w-full relative">
    {loading && (
      <div className="absolute top-[80px] left-0 right-0 bottom-0 bg-white bg-opacity-70 z-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )}
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Training & Courses</p>
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
          placeholder="Search course by name, platform or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[400px] p-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Add Course */}
      <div className="bg-white px-6 py-5 rounded-xl shadow-md border border-gray-200 mb-8 mx-4">
  <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
    <Plus className="h-5 w-5 text-green-600" />
    Add New Course
  </h2>

  {/* Input Fields Grid */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Course Title */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
      <input
        type="text"
        placeholder="Enter course name"
        value={newCourse.name}
        onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>

    {/* Topic */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
      <input
        type="text"
        placeholder="e.g., React, SQL, AI"
        value={newCourse.topic}
        onChange={(e) => setNewCourse({ ...newCourse, topic: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>

    {/* Platform */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
      <input
        type="text"
        placeholder="e.g., Udemy, Coursera"
        value={newCourse.platform}
        onChange={(e) => setNewCourse({ ...newCourse, platform: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>

    {/* Deadline */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
      <input
        type="date"
        value={newCourse.deadline}
        onChange={(e) => setNewCourse({ ...newCourse, deadline: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>

    {/* Course Link */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Course Link</label>
      <input
        type="text"
        placeholder="https://..."
        value={newCourse.link}
        onChange={(e) => setNewCourse({ ...newCourse, link: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  </div>

  {/* Button - Separate and Positioned */}
  <div className="flex justify-end mt-6">
    <button
      onClick={handleAddCourse}
      className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition font-semibold"
    >
      Add Course
    </button>
  </div>
</div>


      {/* Course List */}
      <h2 className="text-lg font-bold text-gray-700 mb-2 px-4">Added Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 mb-6">
        {filteredCourses.map(course => (
          <div key={course.name} className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{course.name}</h3>
            <p className="text-gray-600 mb-1">Platform: {course.platform}</p>
            <p className="text-gray-600 mb-1">Topic: {course.topic}</p>
            <p className="text-gray-600 mb-3">Deadline: {new Date(course.deadline).toLocaleDateString()}</p>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(course.link, '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                View Course
              </button>
              <button
                onClick={() => handleRemoveCourse(course.name)}
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
        <h3 className="text-lg font-semibold text-green-700 mb-3"> Enrolled</h3>
        <div className="overflow-x-auto rounded-lg shadow mb-6">
          <table className="min-w-full bg-white border border-gray-200 text-sm">
            <thead className="bg-green-100 text-gray-800">
              <tr>
                <th className="px-4 py-3 text-left">Employee ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Topic</th>
                <th className="px-4 py-3 text-left">Deadline</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments
                .filter((e) => e.progress < 100)
                .map((enroll, idx) => {
                  const course = courses.find((c) => c.name === enroll.courseId);

                  if (!course) return null;

                  return (
                    <tr key={idx} className="border-t border-gray-200">
                      <td className="px-4 py-3">{enroll.id}</td>

                      <td className="px-4 py-3">{enroll.employee}</td>
                      <td className="px-4 py-3">{course.name}</td>
                      <td className="px-4 py-3">{course.topic}</td>
                      <td className="px-4 py-3">{new Date(course.deadline).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-yellow-600 font-medium">Enrolled</td>
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
                <th className="px-4 py-3 text-left">Topic</th>
                <th className="px-4 py-3 text-left">Completion Date</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments
                .filter((e) => e.progress === 100)
                .map((enroll, idx) => {
                  const course = courses.find((c) => c.name === enroll.courseId);

                  if (!course) return null;

                  return (
                    <tr key={idx} className="border-t border-gray-200">
                      <td className="px-4 py-3">{enroll.id}</td>
                      <td className="px-4 py-3">{enroll.employee}</td>
                      <td className="px-4 py-3">{course.name}</td>
                      <td className="px-4 py-3">{course.topic}</td>
                      <td className="px-4 py-3">{new Date().toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">Completed</td>
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