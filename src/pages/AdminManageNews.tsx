import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Home, Bell, User, UserCircle } from 'lucide-react';

type NewsItem = {
  title: string;
  content: string;
  file: string;
  fileType: string;
};

const defaultNews: NewsItem[] = [
  {
    title: 'Monthly Townhall Scheduled',
    content: 'The monthly townhall will be held on Friday at 4 PM in the auditorium.',
    file: '',
    fileType: '',
  },
  {
    title: 'New Training Launched',
    content: 'All employees are encouraged to complete the new cybersecurity awareness course.',
    file: '',
    fileType: '',
  },
];

const ManageNews = () => {
  const navigate = useNavigate();
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [newNews, setNewNews] = useState<NewsItem>({
    title: '',
    content: '',
    file: '',
    fileType: '',
  });

  // Dropdown state & ref
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('admin_news');
    setNewsList(saved ? JSON.parse(saved) : defaultNews);
  }, []);

  const handleInputChange = (field: keyof NewsItem, value: string) => {
    setNewNews((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        const fileType = file.type.includes('pdf') ? 'pdf' : 'image';
        setNewNews((prev) => ({
          ...prev,
          file: reader.result as string,
          fileType,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const addNewsItem = () => {
    if (!newNews.title || !newNews.content) {
      return alert('Please fill all required fields');
    }
    const updated = [...newsList, newNews];
    setNewsList(updated);
    localStorage.setItem('admin_news', JSON.stringify(updated));
    setNewNews({ title: '', content: '', file: '', fileType: '' });
  };

  const deleteNewsItem = (index: number) => {
    const updated = newsList.filter((_, i) => i !== index);
    setNewsList(updated);
    localStorage.setItem('admin_news', JSON.stringify(updated));
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Manage News</p>
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

          {/* Profile Dropdown */}
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

      {/* Add News Section */}
      <section className="bg-white px-6 py-6 rounded-xl shadow-md space-y-6 mx-4 mt-6">
        <h2 className="text-xl font-semibold text-green-700 border-b pb-2">Add New News</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="col-span-2">
            <label className="text-sm text-gray-700 font-medium">Title</label>
            <Input
              value={newNews.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter news title"
              className="rounded-xl mt-1"
            />
          </div>

          {/* File Upload Styled (matching UploadPayslips style) */}
          <div className="col-span-2">
            <label className="text-sm text-gray-700 font-medium">Upload Image / PDF</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            {newNews.file && newNews.fileType === 'image' && (
              <img src={newNews.file} alt="Preview" className="mt-3 h-32 rounded-md object-cover" />
            )}
            {newNews.file && newNews.fileType === 'pdf' && (
              <embed src={newNews.file} type="application/pdf" className="mt-3 w-full h-48 rounded-md" />
            )}
          </div>


          {/* Content */}
          <div className="col-span-2">
            <label className="text-sm text-gray-700 font-medium">News Content</label>
            <textarea
              rows={4}
              className="w-full border rounded-xl px-4 py-2 text-sm mt-1"
              value={newNews.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Write full news content..."
            ></textarea>
          </div>
        </div>

        {/* Add Button */}
        <div className="text-right">
          <Button onClick={addNewsItem} className="bg-green-600 hover:bg-green-700 text-white rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Add News
          </Button>
        </div>
      </section>

      {/* News List Section */}
      <section className="space-y-4 px-6 py-6">
        <h2 className="text-xl font-semibold text-green-700 border-b pb-2">Added News</h2>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.map((item, idx) => (
            <Card key={idx} className="shadow-sm hover:shadow-md transition rounded-xl border border-gray-200 bg-white">
              <CardContent className="p-4 space-y-3">
                {item.fileType === 'image' && (
                  <img src={item.file} alt="News" className="w-full h-40 object-cover rounded-md" />
                )}
                {item.fileType === 'pdf' && (
                  <embed src={item.file} type="application/pdf" className="w-full h-40 rounded-md" />
                )}
                <h3 className="text-lg font-bold text-green-700">{item.title}</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{item.content}</p>
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => deleteNewsItem(idx)}
                    className="text-sm bg-red-600 hover:bg-red-700 rounded-full"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ManageNews;
