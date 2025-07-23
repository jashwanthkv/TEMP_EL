import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, User, UserCircle, Home } from 'lucide-react';
import { sendRequest } from '@/lib/api';

const UploadPayslips = () => {
  const navigate = useNavigate();
  const [documentRequests, setDocumentRequests] = useState<any[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await sendRequest({ action: 'getDocumentRequests' });
        if (res.success && res.requests) {
          const pending = res.requests.filter((r: any) => r.status === 'Pending');
          setDocumentRequests(pending);
        } else {
          console.error('Failed to fetch document requests:', res.error);
        }
      } catch (error) {
        console.error('Failed to fetch document requests:', error);
      }
    };
    fetchRequests();
  }, []);

  const handleUploadDocument = async (request: any, file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('❌ File too large. Please upload files under 5MB.');
      return;
    }

    setUploadingId(request.id);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = (e.target?.result as string).split(',')[1];
        const payload = {
          action: 'uploadRequestedDocument',
          requestId: request.id,
          email: request.email,
          name: request.name,
          fileData: base64,
          fileName: file.name,
        };

        const res = await sendRequest(payload);
        if (res.success) {
          alert(`✅ Document uploaded for ${request.name}`);
          setDocumentRequests((prev) => prev.filter((r) => r.id !== request.id));
        } else {
          alert('❌ Upload failed: ' + res.error);
        }
      } catch (err) {
        console.error('❌ Error reading or uploading file:', err);
        alert('❌ Error reading file.');
      } finally {
        setUploadingId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-medium text-gray-600">Document Requests</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <span className="text-lg font-bold text-green-700">EMPWR</span>

          <button className="relative text-green-700 hover:text-green-800">
            <Bell className="h-5 w-5" />
          </button>

          <div className="relative group">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full transition">
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
            className="text-green-700 hover:bg-green-100 p-2 rounded-full transition"
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">Pending Uploads</h1>
        </div>

        <div className="space-y-4">
          {documentRequests.length === 0 ? (
            <p className="text-gray-600 text-center">🎉 No pending document requests.</p>
          ) : (
            documentRequests.map((req, index) => (
              <Card key={index} className="border shadow-sm bg-white">
                <CardContent className="p-6 grid md:grid-cols-2 gap-6 items-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{req.name}</p>
                    <p className="text-gray-600">Requested: <span className="font-medium">{req.documentType}</span></p>
                    <p className="text-gray-500 italic">Reason: {req.reason}</p>
                  </div>
                  <div className="flex justify-start md:justify-end">
                    <label className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 transition-colors cursor-pointer">
                      {uploadingId === req.id ? 'Uploading...' : 'Choose & Upload File'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        disabled={uploadingId === req.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadDocument(req, file);
                        }}
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default UploadPayslips;
