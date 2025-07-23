// src/pages/AdminNewsManager.tsx

import React, { useState } from 'react';
import { FileText, Trash, Edit2, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Bell, User, UserCircle } from 'lucide-react';


const AdminNewsManager = () => {
  const [news, setNews] = useState([
    {
      title: '📢 Team Townhall Friday at 4 PM',
      description: 'Discuss product launches, team feedback, and roadmap alignment.',
    },
    {
      title: '🧠 New React Advanced Training',
      description: 'Hooks deep dive, Context API, and optimization modules now live.',
    },
  ]);

  const [editingIndex, setEditingIndex] = useState(null);
  const [newNews, setNewNews] = useState({ title: '', description: '' });

  const handleDelete = (index) => {
    const updated = [...news];
    updated.splice(index, 1);
    setNews(updated);
  };

  const handleEditSave = (index) => {
    setEditingIndex(null);
  };

  const handleAddNews = () => {
    if (newNews.title && newNews.description) {
      setNews([...news, newNews]);
      setNewNews({ title: '', description: '' });
    }
  };

  return (
    <div className="p-6">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Admin NewsManager</p>
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

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.map((item, index) => (
          <Card key={index} className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 space-y-2">
              {editingIndex === index ? (
                <>
                  <input
                    className="w-full border p-2 rounded"
                    value={item.title}
                    onChange={(e) => {
                      const updated = [...news];
                      updated[index].title = e.target.value;
                      setNews(updated);
                    }}
                  />
                  <textarea
                    className="w-full border p-2 rounded"
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...news];
                      updated[index].description = e.target.value;
                      setNews(updated);
                    }}
                  />
                  <Button
                    className="bg-[#32d399] text-white px-4 py-2 rounded"
                    onClick={() => handleEditSave(index)}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="bg-yellow-400 text-white px-3 py-1"
                      onClick={() => setEditingIndex(index)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      className="bg-red-500 text-white px-3 py-1"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-3">Add New News Item</h3>
        <div className="flex flex-col gap-3 max-w-md">
          <input
            className="border p-2 rounded"
            placeholder="Title"
            value={newNews.title}
            onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
          />
          <textarea
            className="border p-2 rounded"
            placeholder="Description"
            value={newNews.description}
            onChange={(e) => setNewNews({ ...newNews, description: e.target.value })}
          />
          <Button className="bg-[#32d399] text-white px-4 py-2 rounded" onClick={handleAddNews}>
            Add News
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminNewsManager;
