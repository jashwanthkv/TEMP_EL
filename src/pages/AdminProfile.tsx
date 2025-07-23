import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Upload, Trash } from 'lucide-react';


const BASE_PATH = '/script-api';

const AdminProfilePanel = () => {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState<string | null>(localStorage.getItem('adminProfilePhotoUrl') || null);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [adminInfo, setAdminInfo] = useState({
    adminName: localStorage.getItem('adminName') || 'Admin',
    adminId: localStorage.getItem('adminId') || 'ADMIN001',
    adminDesignation: localStorage.getItem('adminDesignation') || 'HR Manager',
    adminDepartment: localStorage.getItem('adminDepartment') || 'Human Resources',
    adminEmail: localStorage.getItem('adminEmail') || 'admin@codeblox.com',
    adminJoinedOn: localStorage.getItem('adminJoinedOn') || '2024-01-01',
  });

  const avatarLetter = adminInfo.adminName.charAt(0).toUpperCase();

  const handleUploadPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return alert('Please upload a valid image.');
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (!base64) return;

      try {
        const res = await fetch(BASE_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'uploadAdminProfilePhoto',
            adminId: adminInfo.adminId,
            photoBlob: base64,
          }),
        });

        const json = await res.json();
        if (json.success) {
          setPhotoUrl(json.photoUrl);
          localStorage.setItem('adminProfilePhotoUrl', json.photoUrl);
          alert('✅ Photo uploaded successfully!');
        } else {
          alert('❌ Upload failed.');
        }
      } catch (err) {
        console.error(err);
        alert('❌ Error during upload.');
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    try {
      const res = await fetch(BASE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeAdminProfilePhoto', adminId: adminInfo.adminId }),
      });
      const json = await res.json();
      if (json.success) {
        setPhotoUrl(null);
        localStorage.removeItem('adminProfilePhotoUrl');
        alert('🗑 Profile photo removed');
      } else {
        alert('❌ Failed to remove photo');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error removing photo.');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Admin Panel</p>
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <Avatar className="w-24 h-24 mx-auto mb-4 bg-green-100">
            {photoUrl ? (
              <AvatarImage src={photoUrl} alt="Admin" onError={() => setPhotoUrl(null)} />
            ) : (
              <AvatarFallback className="text-2xl font-bold text-green-700 bg-green-100">
                {avatarLetter}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" /> Upload
            </Button>
            <Button variant="destructive" onClick={handleRemovePhoto}>
              <Trash className="h-4 w-4 mr-1" /> Remove
            </Button>
            <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleUploadPhoto} />
          </div>
        </div>

        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Admin Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900">{adminInfo.adminName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Admin ID</label>
                <p className="text-gray-900">{adminInfo.adminId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{adminInfo.adminEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Department</label>
                <p className="text-gray-900">{adminInfo.adminDepartment}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Designation</label>
                <p className="text-gray-900">{adminInfo.adminDesignation}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Joined On</label>
                <p className="text-gray-900">{formatDate(adminInfo.adminJoinedOn)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfilePanel;
