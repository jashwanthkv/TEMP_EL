// Updated AdminProfile.tsx with profile layout and Google Drive image upload integration

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Home, Upload } from 'lucide-react';

const BASE_PATH = 'https://script.google.com/macros/s/AKfycbw67WPhAKl8VzIzzlUoiWRTBNVg77lwwGNyiIX02BlR-Yk69XvKedFsslAcB6EOBgGTTg/exec';

interface AdminProfileData {
  adminId: string;
  adminName: string;
  adminDesignation: string;
  adminDepartment: string;
  adminEmail: string;
  adminJoinedOn: string;
  adminEmploymentType: string;
  adminStatus: string;
  photoUrl?: string;
}

const CardSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl shadow-sm border mb-6">
    <div className="bg-green-100 px-6 py-3 rounded-t-2xl border-b border-green-200">
      <h3 className="text-lg font-semibold text-green-800">{title}</h3>
    </div>
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

const Field = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border p-4 bg-gray-50">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-base font-medium text-gray-800">{value || '-'}</p>
  </div>
);

const AdminProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfileData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(localStorage.getItem('adminProfilePhotoUrl') || null);

  useEffect(() => {
    const profileData: AdminProfileData = {
      adminId: localStorage.getItem('adminId') || 'ADMIN001',
      adminName: localStorage.getItem('adminName') || 'Admin',
      adminDesignation: localStorage.getItem('adminDesignation') || 'HR Manager',
      adminDepartment: localStorage.getItem('adminDepartment') || 'Human Resources',
      adminEmail: localStorage.getItem('adminEmail') || 'admin@codeblox.com',
      adminJoinedOn: localStorage.getItem('adminJoinedOn') || '2024-01-01',
      adminEmploymentType: localStorage.getItem('adminEmploymentType') || 'Full-Time',
      adminStatus: localStorage.getItem('adminStatus') || 'Active',
      photoUrl: localStorage.getItem('adminProfilePhotoUrl') || '',
    };
    setAdminProfile(profileData);
  }, []);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file || !adminProfile) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const base64Data = (reader.result as string).split(',')[1];
      const response = await fetch(BASE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          EMP_ID: adminProfile.adminId,
          imageData: base64Data,
          fileName: `${adminProfile.adminId}_photo.png`,
          mimeType: file.type,
        }),
      });

      const result = await response.json();
      if (result.imageUrl) {
        localStorage.setItem('adminProfilePhotoUrl', result.imageUrl);
        setImageUrl(result.imageUrl);
      } else {
        console.error('Upload failed:', result);
      }
    } catch (err) {
      console.error('Image upload error:', err);
    }
  };
  reader.readAsDataURL(file);
};


  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-end items-center mb-6 gap-4">
        <button onClick={() => navigate('/home')} className="text-green-600 hover:underline">
          <Home className="inline-block mr-1" /> Home
        </button>
        <Bell />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Side: Photo, Name, Email */}
        <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-sm border p-6 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-green-500 mb-4">
            <img src={imageUrl || '/default-avatar.png'} alt="Admin" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-bold mb-1">{adminProfile?.adminName}</h2>
          <p className="text-sm text-gray-600 mb-4">{adminProfile?.adminEmail}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
          >
            <Upload className="inline-block mr-2 h-4 w-4" /> Upload Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        {/* Right Side: Info Cards */}
        <div className="w-full md:w-2/3">
          <CardSection title="Basic Information">
            <Field label="Admin ID" value={adminProfile?.adminId || ''} />
            <Field label="Name" value={adminProfile?.adminName || ''} />
            <Field label="Designation" value={adminProfile?.adminDesignation || ''} />
            <Field label="Department" value={adminProfile?.adminDepartment || ''} />
            <Field label="Email" value={adminProfile?.adminEmail || ''} />
          </CardSection>

          <CardSection title="Joining Details">
            <Field label="Joined On" value={adminProfile?.adminJoinedOn || ''} />
            <Field label="Employment Type" value={adminProfile?.adminEmploymentType || ''} />
            <Field label="Department" value={adminProfile?.adminDepartment || ''} />
            <Field label="Designation" value={adminProfile?.adminDesignation || ''} />
            <Field label="Status" value={adminProfile?.adminStatus || ''} />
          </CardSection>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;