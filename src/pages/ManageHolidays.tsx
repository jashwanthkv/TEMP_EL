import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const levels = ['Beginner', 'Intermediate', 'Advanced'] as const;
type Level = typeof levels[number];

interface Course {
  id: string;
  title: string;
  platform: string;
  link: string;
  duration?: string;
  level?: Level;
  instructor?: string;
  progress?: number;
  registeredDate?: string;
  isNew?: boolean;
}

type Comment = { courseId: string; text: string; date: string };

const TrainingCourses = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<Level | 'All'>('All');
  const [rating, setRating] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [wishlist, setWishlist] = useState<Course[]>([]);

  const [newCourses, setNewCourses] = useState<Course[]>([
    { id: '1', title: 'React Advanced', platform: 'Udemy', link: '#', duration: '5h', level: 'Advanced', instructor: 'Jane Doe', isNew: true },
    { id: '2', title: 'TypeScript Mastery', platform: 'Coursera', link: '#', duration: '3h', level: 'Intermediate', instructor: 'John Smith' },
    { id: '3', title: 'Google Apps Script', platform: 'Pluralsight', link: '#', duration: '2h', level: 'Beginner', instructor: 'Sarah Connor' },
    { id: '4', title: 'Tailwind CSS Deep Dive', platform: 'YouTube', link: '#', duration: '1.5h', level: 'Intermediate', instructor: 'Mark Lee' },
    { id: '5', title: 'GraphQL Basics', platform: 'Apollo', link: '#', duration: '2h', level: 'Beginner', instructor: 'Amy Adams' },
  ]);

  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([
    { id: '6', title: 'JavaScript Basics', platform: 'Codecademy', link: '#', duration: '4h', level: 'Beginner', instructor: 'Nina Jang', progress: 80 },
    { id: '7', title: 'React Fundamentals', platform: 'Udemy', link: '#', duration: '3.5h', level: 'Intermediate', instructor: 'James Roe', progress: 60 }
  ]);

  const [completedCourses, setCompletedCourses] = useState<Course[]>([]);

  const handleEnroll = (course: Course) => {
    window.open(course.link, '_blank');
    if (!enrolledCourses.some(c => c.id === course.id)) {
      const today = new Date().toLocaleDateString();
      setEnrolledCourses([...enrolledCourses, { ...course, progress: 0, registeredDate: today }]);
      setNewCourses(newCourses.filter(c => c.id !== course.id));
    }
  };

  const handleComplete = (course: Course) => {
    const completedCourse = { ...course, progress: 100, registeredDate: course.registeredDate || new Date().toLocaleDateString() };
    setCompletedCourses([...completedCourses, completedCourse]);
    setEnrolledCourses(enrolledCourses.filter(c => c.id !== course.id));
  };

  const toggleWishlist = (course: Course) => {
    const isWished = wishlist.some(c => c.id === course.id);
    setWishlist(isWished ? wishlist.filter(c => c.id !== course.id) : [...wishlist, course]);
  };

  const filteredCourses = newCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || course.platform.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const downloadCertificate = (course: Course) => {
    alert(`🎉 Certificate for "${course.title}" would be downloaded (PDF simulation).`);
  };

  const completedCount = completedCourses.length;
  const badge = completedCount >= 5 ? "🏆 Pro Learner" : completedCount > 0 ? "🎯 First Step!" : null;

  useEffect(() => {
    localStorage.setItem('enrolledCourses', JSON.stringify(enrolledCourses));
  }, [enrolledCourses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-green-50 to-white py-10 px-4">
      <div className="p-6 max-w-7xl mx-auto bg-white bg-opacity-90 rounded-[3rem] shadow-2xl">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer text-gray-600 w-5 h-5" />
          <h1 className="text-3xl font-bold text-green-600">Training & Courses</h1>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <input
            type="text"
            placeholder="Search by title or platform..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-3 border border-gray-300 rounded-[2rem]"
          />
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as Level | 'All')}
            className="p-3 border border-gray-300 rounded-[2rem]"
          >
            <option value="All">All Levels</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Available Courses */}
        <h2 className="text-2xl font-semibold text-green-700 mb-4">Available Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {filteredCourses.map(course => (
            <div key={course.id} className="bg-white p-6 rounded-[2rem] shadow-xl relative">
              {course.isNew && <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">New</span>}
              <h3 className="text-lg font-bold text-gray-800">{course.title}</h3>
              <p className="text-sm text-gray-500">Platform: {course.platform}</p>
              <p className="text-sm text-gray-500">Duration: {course.duration} | Level: {course.level}</p>
              <p className="text-sm text-gray-500 mb-2">Instructor: {course.instructor}</p>
              <button onClick={() => handleEnroll(course)} className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 mt-2">Enroll</button>
              <button onClick={() => toggleWishlist(course)} className="absolute bottom-2 right-2 text-red-500 hover:text-red-600">
                <Heart fill={wishlist.some(c => c.id === course.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          ))}
        </div>

        {/* Badge */}
        {badge && <div className="mb-10 text-xl font-semibold text-green-700">Your Badge: {badge}</div>}

        {/* Enrolled Courses */}
        <h2 className="text-2xl font-semibold text-green-700 mb-4">Enrolled Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {enrolledCourses.map(course => (
            <div key={course.id} className="bg-white p-6 rounded-[2rem] shadow-xl flex justify-between items-start">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-bold text-gray-800">{course.title}</h3>
                <p className="text-sm text-gray-500">Duration: {course.duration} | Level: {course.level}</p>
                <p className="text-sm text-gray-500 mb-2">Instructor: {course.instructor}</p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={course.progress || 0}
                  onChange={(e) => {
                    const updated = { ...course, progress: parseInt(e.target.value) };
                    setEnrolledCourses(enrolledCourses.map(c => c.id === course.id ? updated : c));
                  }}
                  className="w-full mb-2"
                />
                <div className="flex gap-2">
                  <button onClick={() => window.open(course.link, '_blank')} className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600">Continue</button>
                  <button onClick={() => handleComplete(course)} className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600">Complete</button>
                </div>
              </div>
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                  <circle cx="50" cy="50" r="45" stroke="#10b981" strokeWidth="10" fill="none" strokeDasharray={282.6} strokeDashoffset={282.6 - (282.6 * (course.progress || 0)) / 100} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-green-600 font-bold text-sm">{course.progress}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* Completed Courses */}
        <h2 className="text-2xl font-semibold text-green-700 mb-4">Completed Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {completedCourses.map(course => (
            <div key={course.id} className="bg-green-50 p-6 rounded-[2rem] shadow-xl border border-green-300">
              <h3 className="text-lg font-bold text-green-800">{course.title}</h3>
              <p className="text-sm text-green-700">Completed on: {course.registeredDate}</p>
              <p className="text-sm text-green-700">Instructor: {course.instructor}</p>
              <button onClick={() => downloadCertificate(course)} className="bg-green-600 text-white px-4 py-1 rounded-full hover:bg-green-700 mt-2 text-sm">Download Certificate</button>
              <div className="mt-2">
                <label className="text-sm text-green-700">Rate this course:</label>
                {[1, 2, 3, 4, 5].map(num => (
                  <button key={num} onClick={() => setRating({ ...rating, [course.id]: num })} className="ml-1">
                    {num <= (rating[course.id] || 0) ? '⭐' : '☆'}
                  </button>
                ))}
                {rating[course.id] && <span className="ml-2 text-green-700">{rating[course.id]} ⭐</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainingCourses;
