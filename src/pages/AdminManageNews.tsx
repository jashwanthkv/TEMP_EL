import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Pencil,
  Trash2,
  Plus,
  Home,
  Bell,
  User,
  UserCircle,
} from 'lucide-react';

// Define type
type NewsItem = {
  title: string;
  description: string;
  image: string;
  fullText: string;
};

const defaultNews: NewsItem[] = [
  {
    title: 'Team Townhall Friday at 4 PM',
    description: 'Discuss product launches, team feedback, and roadmap alignment.',
    image: '/townhall.jpg',
    fullText: 'The upcoming townhall covers Q2 highlights and performance awards.',
  },
];

const ManageNews = () => {
  const navigate = useNavigate();
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [newNews, setNewNews] = useState<NewsItem>({
    title: '',
    description: '',
    image: '',
    fullText: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('admin_news');
    setNewsList(saved ? JSON.parse(saved) : defaultNews);
  }, []);

  const handleInputChange = (field: keyof NewsItem, value: string) => {
    setNewNews((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setNewNews((prev) => ({ ...prev, image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const addNewsItem = () => {
    if (!newNews.title || !newNews.description || !newNews.fullText) {
      return alert('Fill all required fields');
    }
    const updated = [...newsList, newNews];
    setNewsList(updated);
    saveToLocal(updated);
    setNewNews({ title: '', description: '', image: '', fullText: '' });
  };

  const saveToLocal = (updated: NewsItem[]) => {
    localStorage.setItem('admin_news', JSON.stringify(updated));
    setNewsList(updated);
  };

  const updateNewsItem = (index: number, field: keyof NewsItem, value: string) => {
    const updated = [...newsList];
    updated[index][field] = value;
    saveToLocal(updated);
  };

  const deleteNewsItem = (index: number) => {
    const updated = newsList.filter((_, i) => i !== index);
    saveToLocal(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8">
      {/* Header */}
      <header className="bg-white shadow border-b px-6 py-4 flex justify-between items-center rounded-md">
        <div className="flex items-center">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain mr-3" />
          <div className="leading-tight">
            <p className="text-lg font-bold text-green-700">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-sm text-gray-600">Admin ManageNews</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-lg font-bold text-green-700">EMPWR</span>
          <button className="relative text-green-700 hover:text-green-800 p-2 rounded-full">
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
            className="text-green-700 hover:bg-green-100 p-2 rounded-full"
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Form Section */}
      <section className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <h2 className="text-xl font-semibold text-green-700 border-b pb-2">Add New News</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700 font-medium">Title</label>
            <Input
              value={newNews.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter news title"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 font-medium">Short Description</label>
            <Input
              value={newNews.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter short description"
            />
          </div>
          <div className="col-span-2">
            <label className="text-sm text-gray-700 font-medium">Image</label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
          <div className="col-span-2">
            <label className="text-sm text-gray-700 font-medium">Full News Content</label>
            <textarea
              rows={4}
              className="w-full border rounded px-3 py-2 text-sm"
              value={newNews.fullText}
              onChange={(e) => handleInputChange('fullText', e.target.value)}
              placeholder="Write full news content..."
            ></textarea>
          </div>
        </div>
        <div className="text-right">
          <Button
            onClick={addNewsItem}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add News
          </Button>
        </div>
      </section>

      {/* News Items Display */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-green-700">Manage Existing News</h2>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.map((item, idx) => (
            <Card
              key={idx}
              className="shadow-sm hover:shadow-md transition rounded-xl border border-gray-200 bg-white"
            >
              <CardContent className="p-4 space-y-3">
                {item.image && (
                  <img
                    src={item.image}
                    alt="News"
                    className="w-full h-40 object-cover rounded-md"
                  />
                )}
                <Input
                  value={item.title}
                  onChange={(e) => updateNewsItem(idx, 'title', e.target.value)}
                  className="font-semibold text-base"
                />
                <Input
                  value={item.description}
                  onChange={(e) => updateNewsItem(idx, 'description', e.target.value)}
                />
                <textarea
                  rows={3}
                  value={item.fullText}
                  onChange={(e) => updateNewsItem(idx, 'fullText', e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                ></textarea>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="destructive"
                    onClick={() => deleteNewsItem(idx)}
                    className="text-sm bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
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
