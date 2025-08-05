// UploadPayslips.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, User, UserCircle, Home, X } from 'lucide-react';
import RequireLogin from '@/components/ui/RequireLogin';
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbybouMUQgNP-l6e7QPjM4fppSZ7nwzCaMFameWAzjJYgOE09kYqUzlVQUPYQ9DlWI-r5w/exec";
import { Dialog } from '@headlessui/react';

// Hybrid request function - use JSONP for all requests, but handle large files differently
function makeRequest(params: Record<string, string>, callback: (data: any) => void) {
  const isFileUpload = params.action === 'uploadDocument' || params.action === 'uploadPayslip';
  
  console.log('Making request:', params.action, 'isFileUpload:', isFileUpload);
  
  if (isFileUpload) {
    // For file uploads, check if the data is too large for JSONP
    const totalLength = Object.values(params).join('').length;
    console.log('Total request length:', totalLength);
    
    if (totalLength > 8000) { // Reduced threshold for better reliability
      console.log('Request too large for JSONP, using fetch with chunked data');
      
      // Use fetch but with a different approach
      const formData = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
      
      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: controller.signal
      })
      .then(response => {
        clearTimeout(timeoutId);
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .then(text => {
        console.log('Fetch response text:', text);
        try {
          const data = JSON.parse(text);
          callback(data);
        } catch (e) {
          console.error('Failed to parse response:', e);
          callback({ error: 'Invalid response format: ' + text.substring(0, 100) });
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error('Fetch error:', error);
        if (error.name === 'AbortError') {
          callback({ error: 'Request timed out after 45 seconds' });
        } else {
          callback({ error: 'Network error: ' + error.message });
        }
      });
    } else {
      // Use JSONP for smaller requests
      console.log('Using JSONP for file upload (small size)');
      makeJsonpRequest(params, callback);
    }
  } else {
    // Use JSONP for simple requests with retry mechanism
    console.log('Using JSONP for simple request:', params.action);
    makeJsonpRequestWithRetry(params, callback, 0);
  }
}

// JSONP request with retry mechanism
function makeJsonpRequestWithRetry(params: Record<string, string>, callback: (data: unknown) => void, retryCount: number) {
  const maxRetries = 2;
  
  makeJsonpRequest(params, (data) => {
    // Check if the request failed due to timeout or network error
    if (data && typeof data === 'object' && 'error' in data) {
      const errorStr = String(data.error);
      if ((errorStr.includes('timed out') || errorStr.includes('Failed to load script')) && retryCount < maxRetries) {
        console.log(`Retry attempt ${retryCount + 1} for action: ${params.action}`);
        setTimeout(() => {
          makeJsonpRequestWithRetry(params, callback, retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }
    }
    callback(data);
  });
}

// Separate JSONP function
function makeJsonpRequest(params: Record<string, string>, callback: (data: unknown) => void) {
  const cbName = 'jsonp_cb_' + Math.round(100000 * Math.random());
  console.log('Making JSONP request with callback:', cbName, 'params:', params);
  
  (window as unknown as Record<string, (data: unknown) => void>)[cbName] = (data: unknown) => {
    console.log('JSONP callback received:', cbName, 'data:', data);
    callback(data);
    delete (window as unknown as Record<string, unknown>)[cbName];
  };
  
  const query = Object.entries({ ...params, callback: cbName })
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  
  const script = document.createElement('script');
  script.src = `${APPS_SCRIPT_URL}?${query}`;
  script.async = true;
  
  // Add error handling for script loading
  script.onerror = () => {
    console.error('JSONP script failed to load:', script.src);
    clearTimeout(timeout);
    delete (window as unknown as Record<string, unknown>)[cbName];
    // Remove the script element to clean up
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
    callback({ error: 'Failed to load script. Please check your internet connection.' });
  };
  
  // Add timeout handling - increased timeout for file uploads
  const isFileAction = params.action === 'uploadDocument' || params.action === 'uploadPayslip';
  const timeoutDuration = isFileAction ? 60000 : 30000; // 60s for uploads, 30s for other requests
  
  const timeout = setTimeout(() => {
    console.error('JSONP request timed out for callback:', cbName, 'after', timeoutDuration / 1000, 'seconds');
    delete (window as unknown as Record<string, unknown>)[cbName];
    // Remove the script element to clean up
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
    callback({ error: `Request timed out after ${timeoutDuration / 1000} seconds. Please check your internet connection and try again.` });
  }, timeoutDuration);
  
  // Override the callback to clear timeout
  const originalCallback = (window as unknown as Record<string, (data: unknown) => void>)[cbName];
  (window as unknown as Record<string, (data: unknown) => void>)[cbName] = (data: unknown) => {
    clearTimeout(timeout);
    console.log('JSONP callback received:', cbName, 'data:', data);
    // Remove the script element to clean up
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
    originalCallback(data);
    delete (window as unknown as Record<string, unknown>)[cbName];
  };
  
  console.log('Adding script to DOM:', script.src);
  document.body.appendChild(script);
}

// Add a helper function for formatting ISO timestamps
function formatDateTime(isoString: string) {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0');
}

const UploadPayslips = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  const navigate = useNavigate();
  type DocumentRequest = {
    id: string;
    empId: string;
    empName: string;
    docName: string;
    status: string;
    reason: string;
    timestamp: string;
    sheetId?: string;
    // driveLink?: string; // Remove this field
  };
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [approvedDocuments, setApprovedDocuments] = useState<DocumentRequest[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<DocumentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [empId, setEmpId] = useState<string>('');
  const [payslipFile, setPayslipFile] = useState<File | null>(null);
  const [recentPayslips, setRecentPayslips] = useState<{ empId: string; fileName: string }[]>([]);
  // Add state for last uploaded payslip and document link
  const [lastPayslipUpload, setLastPayslipUpload] = useState<{ empId: string; fileName: string; link: string } | null>(null);
  const [lastDocumentUpload, setLastDocumentUpload] = useState<{ empName: string; docName: string; link: string } | null>(null);
  
  // Add loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploadingPayslip, setIsUploadingPayslip] = useState<boolean>(false);
  const [loadingError, setLoadingError] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);

  // Fetch all document requests from backend using JSONP
  const fetchData = React.useCallback(() => {
    setIsLoading(true);
    setLoadingError('');
    makeRequest({ action: 'getAllEmployeesPendingDocs' }, (data) => {
      console.log('Initial data fetch:', data);
      
      // Check for timeout or network errors
      if (data && typeof data === 'object' && 'error' in data) {
        const errorStr = String(data.error);
        if (errorStr.includes('timed out') || errorStr.includes('Failed to load script')) {
          setLoadingError(`Connection timeout. Please check your internet connection.`);
          setIsLoading(false);
          return;
        } else {
          setLoadingError(`Error loading data: ${errorStr}`);
          setIsLoading(false);
          return;
        }
      }
      
      console.log('Raw data array:', data.data);
      const requestsArr = Array.isArray(data.data) ? data.data : [];
      console.log('Processed requests array:', requestsArr);
      
      // Filter and map pending requests
      console.log('Filtering for pending requests...');
      const pendingRequests = requestsArr
        .filter((r: { status?: string }) => {
          console.log('Checking request:', r, 'Status:', r.status, 'Lowercase:', r.status?.toLowerCase());
          return r.status && r.status.toLowerCase() === 'pending';
        })
        .map((r: { empId: string | number; docName?: string; empName: string; status: string; reason: string; timestamp: string; sheetId?: string }, idx: number): DocumentRequest => ({
          id: `${String(r.empId)}_${r.docName && r.docName.trim() !== '' ? r.docName : 'N/A'}_${idx}`,
          empId: String(r.empId),
          empName: r.empName,
          docName: r.docName && r.docName.trim() !== '' ? r.docName : 'N/A',
          status: r.status,
          reason: r.reason,
          timestamp: r.timestamp,
          sheetId: r.sheetId
        }));
      
      // Filter and map approved requests
      const approvedRequests = requestsArr
        .filter((r: { status?: string }) => r.status && r.status.toLowerCase() === 'approved')
        .map((r: { empId: string | number; docName?: string; empName: string; status: string; reason: string; timestamp: string; sheetId?: string }, idx: number): DocumentRequest => ({
          id: `${String(r.empId)}_${r.docName && r.docName.trim() !== '' ? r.docName : 'N/A'}_${idx}`,
          empId: String(r.empId),
          empName: r.empName,
          docName: r.docName && r.docName.trim() !== '' ? r.docName : 'N/A',
          status: r.status,
          reason: r.reason,
          timestamp: r.timestamp,
          sheetId: r.sheetId
        }));
      
      // Filter and map rejected requests
      const rejectedRequests = requestsArr
        .filter((r: { status?: string }) => r.status && r.status.toLowerCase() === 'rejected')
        .map((r: { empId: string | number; docName?: string; empName: string; status: string; reason: string; timestamp: string; sheetId?: string }, idx: number): DocumentRequest => ({
          id: `${String(r.empId)}_${r.docName && r.docName.trim() !== '' ? r.docName : 'N/A'}_${idx}`,
          empId: String(r.empId),
          empName: r.empName,
          docName: r.docName && r.docName.trim() !== '' ? r.docName : 'N/A',
          status: r.status,
          reason: r.reason,
          timestamp: r.timestamp,
          sheetId: r.sheetId
        }));
      
      console.log('Setting document requests:', pendingRequests.length, 'pending,', approvedRequests.length, 'approved,', rejectedRequests.length, 'rejected');
      console.log('Pending requests data:', pendingRequests);
      
      setDocumentRequests(pendingRequests);
      setApprovedDocuments(approvedRequests);
      setRejectedRequests(rejectedRequests);
      setIsLoading(false);
      setLoadingError('');
      setRetryCount(0);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('State update - isLoading:', isLoading, 'documentRequests length:', documentRequests.length);
    if (documentRequests.length > 0) {
      console.log('Document requests in state:', documentRequests);
    }
  }, [isLoading, documentRequests]);

  // Upload and approve document for request using JSONP
  const handleUploadDocument = () => {
    if (!selectedRequest || !selectedFile) {
      alert('Please select a request and file to upload.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('❌ File too large. Please upload under 5MB.');
      return;
    }
    setUploading(true);
    console.log('Starting document upload for:', selectedRequest);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      console.log('File read as base64:', base64 ? base64.substring(0, 30) + '...' : 'No base64');
      
      // Step 1: Upload file to Drive (get fileId)
      const fileExtension = selectedFile.name.split('.').pop() || 'pdf';
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14); // Format: YYYYMMDDHHMMSS
      const formattedFileName = `${selectedRequest.docName}_${timestamp}.${fileExtension}`;
      
      makeRequest({
        action: 'uploadDocument',
        empId: selectedRequest.empId,
        fileName: formattedFileName,
        fileBase64: base64
      }, (uploadData) => {
        console.log('Upload response:', uploadData);
        if (uploadData && uploadData.fileId) {
          console.log('File uploaded successfully, fileId:', uploadData.fileId);
          
          // Step 2: Mark document as approved in sheet
          makeRequest({
            action: 'approveDocumentRequest',
            sheetId: selectedRequest.sheetId,
            identifier: selectedRequest.timestamp
          }, (approveData) => {
            console.log('Approval response:', approveData);
            if (approveData && approveData.status === 'success') {
              console.log('Document request approved successfully');
              setLastDocumentUpload({
                empName: selectedRequest.empName,
                docName: selectedRequest.docName,
                link: uploadData.link || uploadData.downloadLink || ''
              });
              alert(`✅ Document uploaded and approved for ${selectedRequest.empName}`);
              
              // Remove from pending requests
              setDocumentRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
              setSelectedRequest(null);
              setSelectedFile(null);
              
              // Refresh data to update approved documents
              setTimeout(() => {
                makeRequest({ action: 'getAllEmployeesPendingDocs' }, (refreshData) => {
                  console.log('Refresh data response:', refreshData);
                  if (refreshData && refreshData.data) {
                    const requestsArr = Array.isArray(refreshData.data) ? refreshData.data : [];
                    
                    // Filter and map approved requests
                    const approvedRequests = requestsArr
                      .filter((r: any) => r.status && r.status.toLowerCase() === 'approved')
                      .map((r: any, idx: number): DocumentRequest => ({
                        id: `${String(r.empId)}_${r.docName && r.docName.trim() !== '' ? r.docName : 'N/A'}_${idx}`,
                        empId: String(r.empId),
                        empName: r.empName,
                        docName: r.docName && r.docName.trim() !== '' ? r.docName : 'N/A',
                        status: r.status,
                        reason: r.reason,
                        timestamp: r.timestamp,
                        sheetId: r.sheetId
                      }));
                    
                    console.log('Refreshed approved documents:', approvedRequests.length);
                    setApprovedDocuments(approvedRequests);
                  }
                });
              }, 1000);
            } else {
              console.error('Approval failed:', approveData);
              alert('❌ Approval failed: ' + (approveData?.error || 'Unknown error'));
            }
            setUploading(false);
          });
        } else {
          console.error('Upload failed:', uploadData);
          alert('❌ Upload failed: ' + (uploadData?.error || 'Unknown error'));
          setUploading(false);
        }
      });
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      alert('❌ Error reading file. Please try again.');
      setUploading(false);
    };
    
    reader.readAsDataURL(selectedFile);
  };

  const handleReject = (req: DocumentRequest) => {
    if (!req.sheetId) {
      alert('❌ Error: Missing sheet ID for this request. Cannot process rejection.');
      console.error('Missing sheetId in request:', req);
      return;
    }
    
    // Update the backend first
    makeRequest({
      action: 'rejectDocumentRequest',
      sheetId: req.sheetId,
      identifier: req.timestamp
    }, (rejectData) => {
      console.log('Reject response:', rejectData);
      if (rejectData && rejectData.status === 'success') {
        console.log('Document request rejected successfully in backend');
        
        // Update local state after successful backend update
        setDocumentRequests((prev) => prev.filter((r) => r.id !== req.id));
        
        // Add to rejected requests with updated status
        const rejectedReq = { ...req, status: 'Rejected' };
        setRejectedRequests((prev) => [...prev, rejectedReq]);
        
        alert(`❌ Request from ${req.empName} has been rejected and updated in the system.`);
      } else {
        console.error('Rejection failed:', rejectData);
        alert('❌ Failed to reject request: ' + (rejectData?.error || 'Unknown error. Please try again.'));
      }
    });
  };

  // Upload payslip to backend using JSONP
  const handlePayslipUpload = () => {
    if (!empId || !payslipFile) {
      alert('Please enter employee ID and upload a file.');
      return;
    }
    if (payslipFile.size > 5 * 1024 * 1024) {
      alert('❌ File too large. Max 5MB allowed.');
      return;
    }
    
    setIsUploadingPayslip(true);
    console.log('Starting payslip upload for empId:', empId, 'fileName:', payslipFile.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      console.log('Payslip file read as base64:', base64 ? base64.substring(0, 30) + '...' : 'No base64');
      
      const fileExtension = payslipFile.name.split('.').pop() || 'pdf';
      const currentDate = new Date();
      const month = currentDate.toLocaleString('default', { month: 'long' });
      const year = currentDate.getFullYear();
      const formattedFileName = `PAYSLIP_${month}_${year}.${fileExtension}`;
      
      makeRequest({
        action: 'uploadPayslip',
        empId,
        fileName: formattedFileName,
        fileBase64: base64
      }, (data) => {
        console.log('Payslip upload response:', data);
        if (data && data.status === 'success') {
          console.log('Payslip uploaded successfully, fileId:', data.fileId);
          setLastPayslipUpload({ empId, fileName: formattedFileName, link: data.link });
          setRecentPayslips((prev) => [...prev, { empId, fileName: formattedFileName }]);
          setEmpId('');
          setPayslipFile(null);
          alert(`✅ Payslip uploaded successfully for Employee ID: ${empId}`);
          
          // Refresh data to update approved documents
          setTimeout(() => {
            makeRequest({ action: 'getAllEmployeesPendingDocs' }, (refreshData) => {
              console.log('Refresh data response:', refreshData);
              if (refreshData && refreshData.data) {
                const requestsArr = Array.isArray(refreshData.data) ? refreshData.data : [];
                
                // Filter and map approved requests
                const approvedRequests = requestsArr
                  .filter((r: any) => r.status && r.status.toLowerCase() === 'approved')
                  .map((r: any, idx: number): DocumentRequest => ({
                    id: `${String(r.empId)}_${r.docName && r.docName.trim() !== '' ? r.docName : 'N/A'}_${idx}`,
                    empId: String(r.empId),
                    empName: r.empName,
                    docName: r.docName && r.docName.trim() !== '' ? r.docName : 'N/A',
                    status: r.status,
                    reason: r.reason,
                    timestamp: r.timestamp,
                    sheetId: r.sheetId
                  }));
                
                console.log('Refreshed approved documents:', approvedRequests.length);
                setApprovedDocuments(approvedRequests);
              }
            });
          }, 1000);
        } else {
          console.error('Payslip upload failed:', data);
          alert('❌ Upload failed: ' + (data?.error || 'Unknown error'));
        }
        setIsUploadingPayslip(false);
      });
    };
    
    reader.onerror = () => {
      console.error('Error reading payslip file');
      alert('❌ Error reading file. Please try again.');
      setIsUploadingPayslip(false);
    };
    
    reader.readAsDataURL(payslipFile);
  };

  // Loading skeleton components
  const DocumentRequestSkeleton = () => (
    <Card className="border hover:shadow-lg transition bg-white rounded-xl animate-pulse">
      <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="mb-2 md:mb-0 flex-1">
          <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
          <div className="h-3 w-64 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-20 bg-gray-200 rounded" />
          <div className="h-10 w-20 bg-gray-200 rounded" />
        </div>
      </CardContent>
    </Card>
  );

  const ApprovedDocumentSkeleton = () => (
    <Card className="border shadow-sm rounded-lg min-h-[110px] animate-pulse">
      <CardContent className="p-4">
        <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-48 bg-gray-200 rounded" />
      </CardContent>
    </Card>
  );

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
            <button className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full transition" title="User Menu" aria-label="User Menu">
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
            title="Go to Admin Panel"
            aria-label="Go to Admin Panel"
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        {loadingError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-red-800 font-medium">Connection Error</h3>
                <p className="text-red-600 text-sm mt-1">{loadingError}</p>
                <p className="text-red-500 text-xs mt-1">
                  Please check your internet connection and ensure the Google Apps Script backend is accessible.
                </p>
              </div>
              <button
                onClick={() => {
                  setRetryCount(prev => prev + 1);
                  fetchData();
                }}
                disabled={isLoading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Retrying...' : `Retry ${retryCount > 0 ? `(${retryCount})` : ''}`}
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Upload Payslip */}
          <section className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload Payslip</h2>
            <Card className="bg-white rounded-xl p-6 border space-y-4">
              <label htmlFor="empIdInput" className="sr-only">Employee ID</label>
              <input
                id="empIdInput"
                type="text"
                placeholder="Enter Employee ID"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                title="Enter Employee ID"
                aria-label="Enter Employee ID"
              />
              <label htmlFor="payslipFileInput" className="sr-only">Upload Payslip File</label>
              <input
                id="payslipFileInput"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setPayslipFile(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                title="Upload Payslip File"
                aria-label="Upload Payslip File"
              />
              <button
                onClick={handlePayslipUpload}
                disabled={isUploadingPayslip}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingPayslip ? 'Uploading...' : 'Upload Payslip'}
              </button>
            </Card>

            <h2 className="text-xl font-semibold text-gray-800 mt-10 mb-4">Approved Documents</h2>
            <div className={`bg-white rounded-xl p-4 border transition-all duration-300 ${approvedDocuments.length > 3 ? 'min-h-[350px] max-h-[380px]' : 'min-h-[350px]'}`}>
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {Array(3).fill(0).map((_, idx) => (
                    <ApprovedDocumentSkeleton key={idx} />
                  ))}
                </div>
              ) : approvedDocuments.length === 0 ? (
                <p className="text-gray-500">No approved documents yet.</p>
              ) : (
                <>
                  {approvedDocuments.length <= 3 ? (
                    <div className="flex flex-col gap-3">
                      {approvedDocuments.map((doc, idx) => (
                        <Card key={idx} className="border shadow-sm rounded-lg min-h-[110px]">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-green-800">{doc.docName || 'N/A'}</span>
                              <span className="text-gray-700">for</span>
                              <span className="font-bold text-gray-800">{doc.empName || 'N/A'}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              EmpID: {doc.empId || 'N/A'} | Reason: {doc.reason || 'N/A'} | Date: {doc.timestamp.split('T')[0] || 'N/A'}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                      {approvedDocuments.map((doc, idx) => (
                        <Card key={idx} className="border shadow-sm rounded-lg min-h-[110px]">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-green-800">{doc.docName || 'N/A'}</span>
                              <span className="text-gray-700">for</span>
                              <span className="font-bold text-gray-800">{doc.empName || 'N/A'}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              EmpID: {doc.empId || 'N/A'} | Reason: {doc.reason || 'N/A'} | Date: {doc.timestamp.split('T')[0] || 'N/A'}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {lastPayslipUpload && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p>
                  Payslip for <strong>{lastPayslipUpload.empId}</strong> uploaded!<br />
                  <a href={lastPayslipUpload.link} target="_blank" rel="noopener noreferrer" className="text-green-700 underline">
                    View Payslip in Drive
                  </a>
                </p>
              </div>
            )}
          </section>

          {/* Document Requests */}
          <section className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Document Requests</h2>
            <div className="space-y-4 mb-6 max-h-[28rem] overflow-y-auto">
              {isLoading ? (
                <div className="space-y-4">
                  {Array(4).fill(0).map((_, idx) => (
                    <DocumentRequestSkeleton key={idx} />
                  ))}
                </div>
              ) : documentRequests.length === 0 ? (
                <div className="text-center text-gray-500 text-lg">No pending document requests.</div>
              ) : (
                documentRequests.map((req) => (
                  <Card key={req.id} className="border hover:shadow-lg transition bg-white rounded-xl">
                    <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div className="mb-2 md:mb-0">
                        <p className="text-xl font-semibold text-gray-800">
                          {req.empName || 'N/A'} <span className="text-sm text-gray-500">({req.empId || 'N/A'})</span>
                        </p>
                        <p className="text-sm text-gray-600">Document: {req.docName || 'N/A'} <span className="text-xs text-gray-500">({formatDateTime(req.timestamp)})</span></p>
                        <p className="text-xs text-gray-500">Reason: {req.reason || 'N/A'}</p>
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
              {isLoading ? (
                <div className="space-y-3">
                  {Array(2).fill(0).map((_, idx) => (
                    <Card key={idx} className="border border-gray-200 bg-gray-50 shadow-sm rounded-xl animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                        <div className="h-3 w-64 bg-gray-200 rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : rejectedRequests.length === 0 ? (
                <p className="text-center text-gray-400">No rejected requests yet.</p>
              ) : (
                rejectedRequests.map((req) => (
                  <Card key={req.id} className="border border-gray-200 bg-gray-50 shadow-sm rounded-xl">
                    <CardContent className="p-4">
                      <p className="text-gray-700">
                        <strong>{req.empName}</strong>'s request for <strong>{req.docName}</strong>.<br />
                        <span className="text-xs text-gray-500">Reason: {req.reason || 'N/A'} | Timestamp: {formatDateTime(req.timestamp)}</span>
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
            <button 
              onClick={() => setSelectedRequest(null)}
              className="p-1 hover:bg-gray-100 rounded transition"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Upload document for <strong>{selectedRequest?.empName}</strong>
          </p>
          <label htmlFor="modalFileInput" className="sr-only">Upload Document File</label>
          <input
            id="modalFileInput"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="mb-4 border border-gray-300 rounded-lg px-3 py-2 w-full"
            title="Upload Document File"
            aria-label="Upload Document File"
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
