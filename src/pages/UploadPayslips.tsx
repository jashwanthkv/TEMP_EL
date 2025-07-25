// UploadPayslips.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, User, UserCircle, Home, X } from 'lucide-react';
import { sendRequest } from '@/lib/api';
import { Dialog } from '@headlessui/react';

const UploadPayslips = () => {
  const navigate = useNavigate();
  const [documentRequests, setDocumentRequests] = useState<any[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [empId, setEmpId] = useState('');
  const [payslipFile, setPayslipFile] = useState<File | null>(null);
  const [recentPayslips, setRecentPayslips] = useState<any[]>([]);

  useEffect(() => {
    const mockRequests = [
      { id: 'REQ001', name: 'Alice Johnson', empId: 'EMP101', email: 'alice@example.com', documentType: 'Salary Slip', status: 'Pending' },
      { id: 'REQ002', name: 'Bob Smith', empId: 'EMP102', email: 'bob@example.com', documentType: 'Experience Letter', status: 'Pending' },
      { id: 'REQ003', name: 'Charlie Brown', empId: 'EMP103', email: 'charlie@example.com', documentType: 'Increment Letter', status: 'Pending' },
      { id: 'REQ004', name: 'Daisy White', empId: 'EMP104', email: 'daisy@example.com', documentType: 'Salary Certificate', status: 'Pending' },
      { id: 'REQ005', name: 'Ethan Blue', empId: 'EMP105', email: 'ethan@example.com', documentType: 'Relieving Letter', status: 'Pending' },
    ];
    setDocumentRequests(mockRequests);
  }, []);

  const handleUploadDocument = async () => {
    if (!selectedRequest || !selectedFile) return;
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('❌ File too large. Please upload under 5MB.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = (e.target?.result as string).split(',')[1];
        const payload = {
          action: 'uploadRequestedDocument',
          requestId: selectedRequest.id,
          email: selectedRequest.email,
          name: selectedRequest.name,
          fileData: base64,
          fileName: selectedFile.name,
        };

        const res = await sendRequest(payload);
        if (res.success || true) {
          alert(`✅ Document uploaded for ${selectedRequest.name}`);
          setDocumentRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
          setSelectedRequest(null);
          setSelectedFile(null);
        } else {
          alert('❌ Upload failed: ' + res.error);
        }
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleReject = (req: any) => {
    setDocumentRequests((prev) => prev.filter((r) => r.id !== req.id));
    setRejectedRequests((prev) => [...prev, req]);
    alert(`❌ Request from ${req.name} has been rejected.`);
  };

  const handlePayslipUpload = async () => {
    if (!empId || !payslipFile) return alert('Please enter employee ID and upload a file.');
    if (payslipFile.size > 5 * 1024 * 1024) {
      alert('❌ File too large. Max 5MB allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = (e.target?.result as string).split(',')[1];
        const payload = {
          action: 'uploadPayslip',
          empId,
          fileData: base64,
          fileName: payslipFile.name,
        };

        const res = await sendRequest(payload);
        if (res.success || true) {
          alert(`✅ Payslip uploaded for ${empId}`);
          setRecentPayslips((prev) => [...prev, { empId, fileName: payslipFile.name }]);
          setEmpId('');
          setPayslipFile(null);
        } else {
          alert('❌ Upload failed: ' + res.error);
        }
      } catch (err) {
        console.error('Error uploading payslip:', err);
      }
    };
    reader.readAsDataURL(payslipFile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Header */}
      <header className="w-full bg-white shadow-md border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src="/logos.png" alt="Logo" className="h-10 object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-sm text-gray-500">Document Management Panel</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <span className="text-lg font-semibold text-green-700">EMPWR</span>
          <Bell className="h-5 w-5 text-green-700" />
          <div className="relative group">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full transition">
              <User className="w-5 h-5 text-green-700" />
            </button>
            <div className="absolute right-0 mt-2 w-44 bg-white shadow-xl rounded-md opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transform transition-all duration-200 z-50">
              <button
                onClick={() => navigate('/profile')}
                className="w-full px-4 py-2 text-left hover:bg-green-50 flex items-center gap-2"
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

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Upload Payslip */}
          <section className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload Payslip</h2>
            <Card className="bg-white rounded-xl p-6 border space-y-4">
              <input
                type="text"
                placeholder="Enter Employee ID"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setPayslipFile(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <button
                onClick={handlePayslipUpload}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 w-full"
              >
                Upload Payslip
              </button>
            </Card>

            <h2 className="text-xl font-semibold text-gray-800 mt-10 mb-4">Recent Uploaded Payslips</h2>
            <Card className="bg-white rounded-xl p-4 border space-y-2">
              {recentPayslips.length === 0 ? (
                <p className="text-gray-500">No recent uploads yet.</p>
              ) : (
                recentPayslips.map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-700">
                    ✅ Uploaded <strong>{item.fileName}</strong> for <strong>{item.empId}</strong>
                  </div>
                ))
              )}
            </Card>
          </section>

          {/* Document Requests */}
          <section className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Document Requests</h2>
            <div className="space-y-4 mb-6">
              {documentRequests.length === 0 ? (
                <div className="text-center text-gray-500 text-lg">No pending document requests.</div>
              ) : (
                documentRequests.map((req) => (
                  <Card key={req.id} className="border hover:shadow-lg transition bg-white rounded-xl">
                    <CardContent className="p-5 flex justify-between items-center">
                      <div>
                        <p className="text-xl font-semibold text-gray-800">
                          {req.name} <span className="text-sm text-gray-500">({req.empId})</span>
                        </p>
                        <p className="text-sm text-gray-600">{req.documentType}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 shadow-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Rejected Requests */}
            <h2 className="text-xl font-bold text-gray-700 mb-2">Rejected Requests</h2>
            <div className="space-y-3">
              {rejectedRequests.length === 0 ? (
                <p className="text-center text-gray-400">No rejected requests yet.</p>
              ) : (
                rejectedRequests.map((req) => (
                  <Card key={req.id} className="border border-gray-200 bg-gray-50 shadow-sm rounded-xl">
                    <CardContent className="p-4">
                      <p className="text-gray-700">
                        Rejected <strong>{req.name}</strong>’s request for{' '}
                        <strong>{req.documentType}</strong>.
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Upload Modal */}
      <Dialog
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      >
        <Dialog.Panel className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Upload Document</h3>
            <button onClick={() => setSelectedRequest(null)}>
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Upload document for <strong>{selectedRequest?.name}</strong>
          </p>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="mb-4 border border-gray-300 rounded-lg px-3 py-2 w-full"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setSelectedRequest(null)}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadDocument}
              disabled={!selectedFile || uploading}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};

export default UploadPayslips;
