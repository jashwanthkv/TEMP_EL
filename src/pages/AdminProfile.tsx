import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Home, Upload } from 'lucide-react';
import NotificationBell from '@/components/ui/NotificationBell';
import RequireLogin from '@/components/ui/RequireLogin';

const BASE_PATH = 'https://script.google.com/macros/s/AKfycbz0b9c2rTYUGRSyVbbsXVcnenIFOIbsuQY2JrvP_Ar65QW1fIJcv61Y39aXA-VOing0dg/exec';

interface AdminProfileData {
  empId: any;
  adminId: string;
  adminName: string;
  adminDesignation: string;
  adminDepartment: string;
  adminEmail: string;
  adminJoinedOn: string;
  adminEmploymentType: string;
  adminStatus: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
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
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  const navigate = useNavigate();
  const [adminProfile, setAdminProfile] = useState<AdminProfileData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    // Use userId and userRole for admin, fallback to EMP_ID for employees
    const empId = localStorage.getItem('userId') || localStorage.getItem('EMP_ID');
    const userRole = localStorage.getItem('userRole');
    const role = userRole === 'admin' ? 'Admin' : 'Employees';
    console.log('EMP_ID:', empId, 'userRole:', userRole, 'role:', role);
    if (!empId) return;
    fetch(`${BASE_PATH}?EMP_ID=${empId}&role=${role}`)
      .then(res => res.json())
      .then(async data => {
        console.log('Profile fetch response:', data);
        // Map backend fields to admin fields
        if (data.EMP_ID || data.adminId || data.adminName) {
          setAdminProfile({
            empId: data.EMP_ID || empId,
            adminId: data.adminId || data.EMP_ID || localStorage.getItem('userId') || 'ADMIN001',
            adminName: data.adminName || data.EMP_NAME || localStorage.getItem('userName') || 'Admin',
            adminDesignation: data.adminDesignation || data.POSITION || localStorage.getItem('userDesignation') || 'HR Manager',
            adminDepartment: data.adminDepartment || data.DEPT || localStorage.getItem('userDepartment') || 'Human Resources',
            adminEmail: data.adminEmail || data.EMAIL || localStorage.getItem('userEmail') || 'admin@codeblox.com',
            adminJoinedOn: data.adminJoinedOn || data.JOINED || localStorage.getItem('userJoinedOn') || '2024-01-01',
            adminEmploymentType: data.adminEmploymentType || data.ROLE || 'Full-Time',
            adminStatus: data.adminStatus || data.STATE || localStorage.getItem('userStatus') || 'Active',
            phone: data.phone || data.PHONE || '',
            dob: data.dob || data.DOB || '',
            gender: data.gender || data.GENDER || '',
            address: data.address || data.ADDRESS || '',
            photoUrl: '',
          });
          if (data.IMAGE_URL) {
            // Always fetch the data URI for the image
            try {
              const imgRes = await fetch(`${BASE_PATH}?fileId=${data.IMAGE_URL}`);
              const dataUri = await imgRes.text();
              setImageUrl(dataUri);
            } catch (err) {
              setImageUrl(null);
            }
          } else {
            setImageUrl(null);
          }
        } else {
          alert('Admin profile not found.');
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        alert('Failed to fetch admin profile.');
      });
  }, []);


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminProfile) return;

    const userRole = localStorage.getItem('userRole');
    const role = userRole === 'admin' ? 'Admin' : 'Employees';

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      const payload = {
        EMP_ID: adminProfile.empId.toString(),
        imageData: base64Data,
        fileName: file.name,
        mimeType: file.type,
        role: role,
      };

      try {
        const res = await fetch(BASE_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (result.fileId) {
          // Fetch the new image as data URI
          try {
            const imgRes = await fetch(`${BASE_PATH}?fileId=${result.fileId}`);
            const dataUri = await imgRes.text();
            setImageUrl(dataUri);
          } catch (err) {
            setImageUrl(null);
          }
          alert('Image uploaded successfully');
        } else {
          alert('Image Upload Successfully')
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

 if (!adminProfile) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 text-sm">Loading profile...</p>
    </div>
  );
}


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <header className="bg-white shadow-sm border-b px-6 py-4 fixed top-0 w-full z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 object-contain" />
          <div>
            <p className="text-lg font-bold text-green-800">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base text-gray-600">Admin Profile</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <span className="text-lg font-bold text-green-800">EMPWR</span>
          <button
                            onClick={() => navigate('/admin/notifications')}
                            className="relative text-green-800 hover:text-green-900"
                          >
                            <Bell className="h-5 w-5" />
                          </button>
          <button onClick={() => navigate('/admin')} className="text-green-800 hover:bg-green-100 p-2 rounded-full">
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      <aside className="w-full md:w-1/4 bg-white p-4 border-r pt-24">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-green-100 overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="Admin" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-green-600 text-6xl font-bold bg-green-50">A</div>
            )}
          </div>
          <h2 className="text-xl font-semibold">{adminProfile.adminName}</h2>
          <p className="text-sm text-gray-500">{adminProfile.adminDesignation}</p>

          <label className="mt-6 text-green-600 hover:underline text-sm flex items-center justify-center gap-1 cursor-pointer">
            <Upload size={14} /> Upload New Photo
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      </aside>

      <main className="w-full md:w-3/4 p-6 pt-28 overflow-y-auto">
        <CardSection title="Basic Information">
          <Field label="Admin ID" value={adminProfile.adminId} />
          <Field label="Name" value={adminProfile.adminName} />
          <Field label="Designation" value={adminProfile.adminDesignation} />
          <Field label="Department" value={adminProfile.adminDepartment} />
          <Field label="Email" value={adminProfile.adminEmail} />
        </CardSection>

        <CardSection title="Joining Details">
          <Field label="Joined On" value={adminProfile.adminJoinedOn.split('T')[0]} />
          <Field label="Employment Type" value={adminProfile.adminEmploymentType} />
          <Field label="Status" value={adminProfile.adminStatus} />
        </CardSection>


        <CardSection title="Personal Information">
          <Field label="Phone" value={adminProfile.phone || ''} />
          <Field label="Date of Birth" value={adminProfile.dob.split('T')[0] || ''} />
          <Field label="Gender" value={adminProfile.gender || ''} />
          <Field label="Address" value={adminProfile.address || ''} />
        </CardSection>
      </main>
    </div>
  );
}


export default AdminProfile;

