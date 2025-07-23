import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Home, Upload, User } from 'lucide-react';

interface ProfileData {
  EMP_ID: number;
  EMP_NAME: string;
  EMP_LAST_NAME: string;
  POSITION: string;
  DEPT: string;
  EMAIL: string;
  PHONE: string;
  JOINED: string;
  ROLE: string;
  STATE: string;
  GENDER: string;
  DOB: string;
  PEMAIL: string;
  ADDRESS: string;
  RP_MAN: string;
  IMAGE_URL?: string;
}

const CardSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
    <h3 className="text-lg font-semibold text-green-700 mb-4 border-b border-gray-300 pb-1">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

const Field = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border p-4 bg-gray-50">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-base font-medium text-gray-800">{value || '-'}</p>
  </div>
);

const scriptUrl = 'https://script.google.com/macros/s/AKfycbzUnpG-dz3pXiQQlrG35eU2-k4kH95Rq9tRN_axyhqgRWNW0n3hfKtZtGD0JBRd7gyIxg/exec';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const empId = Number(localStorage.getItem('userId') || '4');
    fetch(`${scriptUrl}?EMP_ID=${empId}`)
      .then(res => res.json())
      .then(data => {
        if (data.EMP_ID) {
          setProfile(data);
          if (data.IMAGE_URL) {
            setImageUrl(`${scriptUrl}?fileId=${data.IMAGE_URL}`);
          }
        } else {
          alert('Profile not found.');
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        alert('Failed to fetch profile.');
      });
  }, []);

  // New effect: Fetch the actual data URI when fileId URL is set
  useEffect(() => {
    if (imageUrl && imageUrl.startsWith(scriptUrl)) {
      fetch(imageUrl, { method: 'GET' })
        .then(res => res.text())
        .then(dataUri => setImageUrl(dataUri))
        .catch(err => console.error('Failed to load image:', err));
    }
  }, [imageUrl]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      const payload = {
        EMP_ID: profile.EMP_ID.toString(),
        imageData: base64Data,
        fileName: file.name,
        mimeType: file.type,
      };

      try {
        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (result.fileId) {
          const fileIdUrl = `${scriptUrl}?fileId=${result.fileId}`;
          setImageUrl(fileIdUrl);
          alert('Image uploaded successfully');
        } else {
          alert('Image upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed');
      }
    };

    reader.readAsDataURL(file);
  };

  if (!profile) return <div className="p-6 text-center">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <header className="bg-white shadow-sm border-b px-6 py-4 fixed top-0 w-full z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 object-contain" />
          <div>
            <p className="text-lg font-bold text-green-800">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base text-gray-600">Profile</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <span className="text-lg font-bold text-green-800">EMPWR</span>
          <button onClick={() => navigate('/notifications')} className="text-green-800 hover:text-green-900">
            <Bell className="h-5 w-5" />
          </button>
          <button onClick={() => navigate('/dashboard')} className="text-green-800 hover:bg-green-100 p-2 rounded-full">
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      <aside className="w-full md:w-1/4 bg-white p-4 border-r pt-24">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-green-100 overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User className="text-green-600 mx-auto mt-8" size={64} />
            )}
          </div>
          <h2 className="text-xl font-semibold">{profile.EMP_NAME} {profile.EMP_LAST_NAME}</h2>
          <p className="text-sm text-gray-500">{profile.POSITION}</p>

          <label className="mt-6 text-green-600 hover:underline text-sm flex items-center justify-center gap-1 cursor-pointer">
            <Upload size={14} /> Upload New Photo
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      </aside>

      <main className="w-full md:w-3/4 p-6 pt-28 overflow-y-auto">
        <CardSection title="Basic Information">
          <Field label="Full Name" value={`${profile.EMP_NAME} ${profile.EMP_LAST_NAME}`} />
          <Field label="Employee ID" value={profile.EMP_ID} />
          <Field label="Gender" value={profile.GENDER} />
          <Field label="Date of Birth" value={profile.DOB} />
          <Field label="Mobile Number" value={profile.PHONE} />
          <Field label="Email Address" value={profile.EMAIL} />
          <Field label="Personal Email" value={profile.PEMAIL} />
          <Field label="Communication Address" value={profile.ADDRESS} />
        </CardSection>

        <CardSection title="Joining Details">
          <Field label="Date of Joining" value={profile.JOINED} />
          <Field label="Employment Type" value={profile.ROLE} />
          <Field label="Department" value={profile.DEPT} />
          <Field label="Designation" value={profile.POSITION} />
          <Field label="Reporting Manager" value={profile.RP_MAN} />
          <Field label="State" value={profile.STATE} />
        </CardSection>
      </main>
    </div>
  );
};

export default Profile;
