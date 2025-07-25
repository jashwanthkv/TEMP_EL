import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Home, Bell, User, UserCircle } from 'lucide-react';

type Course = {
  name: string;
  platform: string;
  deadline: string;
  link: string;
  topic: string;
};

const TrainingCourses = () => {
  const [search, setSearch] = useState('');
  const [notYetCourses, setNotYetCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const scriptURL =
    'https://script.google.com/macros/s/AKfycbwAlAIg39DiQgbYnlivOr9zIowb_2Y3iW9o1kDFBItgMYPxqewxeLX1b7hbrXs61MeWAA/exec';

  useEffect(() => {
  const sheetId = localStorage.getItem("spreadsheetId");
  if (!sheetId) {
    console.error("Sheet ID not found in localStorage");
    setLoading(false);
    return;
  }

  fetch(`${scriptURL}?sheetId=${sheetId}`)
    .then((res) => res.json())
    .then((data) => {
      setNotYetCourses(data.notYet || []);
      setEnrolledCourses(data.enrolled || []);
      setCompletedCourses(data.completed || []);
    })
    .catch((err) => console.error('Error fetching courses:', err))
    .finally(() => setLoading(false));
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
    setNotYetCourses((prev) => prev.filter((c) => c.name !== course.name));
    setEnrolledCourses((prev) => [...prev, course]);
    updateStatus(course, 'enrolled');
  };

  const handleComplete = (course: Course) => {
    setEnrolledCourses((prev) => prev.filter((c) => c.name !== course.name));
    setCompletedCourses((prev) => [...prev, course]);
    updateStatus(course, 'completed');
  };

  const filteredCourses = notYetCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.platform.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-600 border-opacity-40"></div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Training Courses</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 sm:space-x-6 relative">
          <span className="text-base sm:text-lg font-bold text-green-700">EMPWR</span>
          <button
  onClick={() => navigate('/notifications')}
  className="relative text-green-800 hover:text-green-900"
>
  <Bell className="h-5 w-5" />
</button>


          {/* Profile Dropdown */}
          <div className="relative">
            <button
              className="w-9 h-9 flex items-center justify-center hover:bg-green-100 rounded-full"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <User className="w-5 h-5 text-green-700" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg z-50 border">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/profile');
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Search */}
        <div className="w-full">
          <Input
            placeholder="Search course by name or platform..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full px-4 py-2"
          />
        </div>

        {/* Suggested Courses */}
        <section>
          <h3 className="text-xl font-bold text-gray-800 mb-3"> Suggested Courses</h3>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-5 w-max">
              {filteredCourses.map((course, idx) => (
                <Card key={`${course.name}-${idx}`} className="w-[320px] min-h-[260px] rounded-2xl shadow-md border bg-white">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold">{course.name}</h4>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">New</span>
                    </div>
                    <p className="text-sm text-gray-500">Platform: {course.platform}</p>
                    <p className="text-sm text-gray-500">Topic: {course.topic}</p>
                    <p className="text-sm text-gray-500">Deadline: {new Date(course.deadline).toLocaleDateString()}</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        className="flex-1 rounded-full text-white bg-green-600 hover:bg-green-700"
                        onClick={() => handleEnroll(course)}
                      >
                        Enroll
                      </Button>
                      {course.link ? (
                        <a
                          href={course.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-full px-3 py-2"
                        >
                          Details
                        </a>
                      ) : (
                        <span className="flex-1 text-center text-xs text-red-500 pt-2">Link not available</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enrolled */}
        <section>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Enrolled Courses ({enrolledCourses.length})</h3>
          {enrolledCourses.length === 0 ? (
            <p className="text-gray-500">You have not enrolled in any courses yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledCourses.map((course) => (
                <Card key={course.name} className="p-4 flex justify-between items-center rounded-xl border shadow-sm">
                  <div>
                    <h4 className="font-semibold text-lg">{course.name}</h4>
                    <p className="text-sm text-gray-500">Platform: {course.platform}</p>
                    <p className="text-sm text-gray-500">Topic: {course.topic}</p>
                    <p className="text-sm text-gray-500">Deadline: {new Date(course.deadline).toLocaleDateString()}</p>
                    {course.link ? (
                      <a href={course.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm underline">
                        Go to Course
                      </a>
                    ) : (
                      <p className="text-xs text-red-500">Link not available</p>
                    )}
                  </div>
                  <Button
                    className="rounded-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-1"
                    onClick={() => handleComplete(course)}
                  >
                    Completed
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Completed */}
        <section>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Completed Courses ({completedCourses.length})</h3>
          {completedCourses.length === 0 ? (
            <p className="text-gray-500">You haven't completed any courses yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedCourses.map((course) => (
                <Card key={course.name} className="p-4 rounded-xl border shadow-sm bg-gray-100">
                  <div>
                    <h4 className="font-semibold text-lg">{course.name}</h4>
                    <p className="text-sm text-gray-500">Platform: {course.platform}</p>
                    <p className="text-sm text-gray-500">Topic: {course.topic}</p>
                    <p className="text-sm text-gray-500">Deadline: {new Date(course.deadline).toLocaleDateString()}</p>
                    {course.link ? (
                      <a href={course.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm underline">
                        Go to Course
                      </a>
                    ) : (
                      <p className="text-xs text-red-500">Link not available</p>
                    )}
                    <p className="text-xs mt-2 text-green-600 font-medium">🎉 Course marked as completed!</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default TrainingCourses;
