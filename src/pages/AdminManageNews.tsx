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
  link?: string;
};

const RAW_GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzxMS4Fv9LMkaq-Qod-IGjQRGkAA_FYMTeM4nP1xp1DkbjYdOLgJU71DptCxg7zbb_VSA/exec';

// Use CORS proxy in development
const GAS_ENDPOINT = process.env.NODE_ENV === 'development'
  ? `https://corsproxy.io/?${RAW_GAS_ENDPOINT}`
  : RAW_GAS_ENDPOINT;


const ManageNews = () => {
  const navigate = useNavigate();
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [newNews, setNewNews] = useState<NewsItem>({ title: '', content: '', file: '', fileType: '' });
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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
    fetch(GAS_ENDPOINT + '?action=getAllNews')
      .then(res => res.json())
      .then((data) => {
        const updated = data.map((item: any) => ({
          title: item.title,
          content: item.description,
          file: item.link,
          fileType: item.link.includes('.pdf') ? 'pdf' : 'image',
          link: item.link,
        }));
        setNewsList(updated);
      })
      .catch(err => console.error("Failed to fetch news:", err));
  }, []);

  const handleInputChange = (field: keyof NewsItem, value: string) => {
    setNewNews((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileObject(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        const fileType = file.type.includes('pdf') ? 'pdf' : 'image';
        setNewNews((prev) => ({ ...prev, file: reader.result as string, fileType }));
      }
    };
    reader.readAsDataURL(file);
  };

  const addNewsItem = async () => {
    if (!newNews.title || !newNews.content || !newNews.file || !fileObject) {
      return alert('Please fill all fields and upload a file.');
    }

    const base64 = newNews.file.split(',')[1];
    const payload = {
      action: 'uploadNews',
      fileBase64: base64,
      fileName: fileObject.name,
      title: newNews.title,
      description: newNews.content,
    };

    try {
      const response = await fetch(GAS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.status !== 'success') {
        alert(result.message || 'Upload failed');
        return;
      }

      const fileType = result.link.includes('.pdf') ? 'pdf' : 'image';
      const added = {
        title: result.title,
        content: result.description,
        file: result.link,
        fileType,
      };

      setNewsList((prev) => [...prev, added]);
      setNewNews({ title: '', content: '', file: '', fileType: '' });
      setFileObject(null);
    } catch (err) {
      console.error(err);
      alert('An error occurred while uploading news.');
    }
  };

  const deleteNewsItem = (index: number) => {
    const updated = newsList.filter((_, i) => i !== index);
    setNewsList(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header and profile section omitted for brevity */}

      <section className="bg-white px-6 py-6 rounded-xl shadow-md space-y-6 mx-4 mt-6">
        <h2 className="text-xl font-semibold text-green-700 border-b pb-2">Add New News</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="text-sm text-gray-700 font-medium">Title</label>
            <Input value={newNews.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="Enter news title" className="rounded-xl mt-1" />
          </div>

          <div className="col-span-2">
            <label className="text-sm text-gray-700 font-medium">Upload Image / PDF</label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            {newNews.file && newNews.fileType === 'image' && (
              <img src={newNews.file} alt="Preview" className="mt-3 h-32 rounded-md object-cover" />
            )}
            {newNews.file && newNews.fileType === 'pdf' && (
              <embed src={newNews.file} type="application/pdf" className="mt-3 w-full h-48 rounded-md" />
            )}
          </div>

          <div className="col-span-2">
            <label className="text-sm text-gray-700 font-medium">News Content</label>
            <textarea rows={4} className="w-full border rounded-xl px-4 py-2 text-sm mt-1" value={newNews.content} onChange={(e) => handleInputChange('content', e.target.value)} placeholder="Write full news content..."></textarea>
          </div>
        </div>

        <div className="text-right">
          <Button onClick={addNewsItem} className="bg-green-600 hover:bg-green-700 text-white rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Add News
          </Button>
        </div>
      </section>

      <section className="space-y-4 px-6 py-6">
        <h2 className="text-xl font-semibold text-green-700 border-b pb-2">Added News</h2>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.map((item, idx) => (
            <Card key={idx} className="shadow-sm hover:shadow-md transition rounded-xl border border-gray-200 bg-white">
              <CardContent className="p-4 space-y-3">
                {item.fileType === 'image' && <img src={item.file} alt="News" className="w-full h-40 object-cover rounded-md" />}
                {item.fileType === 'pdf' && <embed src={item.file} type="application/pdf" className="w-full h-40 rounded-md" />}
                <h3 className="text-lg font-bold text-green-700">{item.title}</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{item.content}</p>
                <div className="flex justify-end">
                  <Button variant="destructive" onClick={() => deleteNewsItem(idx)} className="text-sm bg-red-600 hover:bg-red-700 rounded-full">
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
