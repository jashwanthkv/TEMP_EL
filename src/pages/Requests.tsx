
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Download, FileText, Send } from 'lucide-react';
import {  Bell, Home, User, UserCircle } from 'lucide-react';

// Direct Google Apps Script URL - UPDATED WITH NEW DEPLOYMENT
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzcgXozG8UVlaZLUXe3BMJ_TrPS-VMBtkWftPOoUwJSq3ct1GHPAcfJ5Ly7hkcOfCFDXg/exec';

// API function to interact with Google Apps Script
async function callAppsScript(action: string, params: Record<string, string | number> = {}): Promise<ApiResponse> {
  // Get configuration from localStorage - handle both correct and typo versions
  const spreadsheetId = localStorage.getItem('spreadsheetId') || localStorage.getItem('spreadsheeetId');
  const empId = localStorage.getItem('empId') || localStorage.getItem('userId');
  
  console.log('API Call Config:', { 
    action, 
    spreadsheetId: spreadsheetId ? 'Found' : 'Missing', 
    empId: empId ? 'Found' : 'Missing',
    spreadsheetIdValue: spreadsheetId,
    empIdValue: empId
  });
  
  if (!spreadsheetId && action !== 'test') {
    return { error: 'Missing spreadsheetId. Please ensure it is set in localStorage.' };
  }
  
  // Include empId for payslips and approved docs actions, spreadsheetId for all actions
  const requestData = { 
    action, 
    ...(spreadsheetId ? { spreadsheetId } : {}),
    ...(empId && (action === 'getPayslips' || action === 'getApprovedDocs') ? { empId } : {}),
    ...params 
  };
  
  console.log('Request Data:', requestData);
  
  // Strategy 1: POST with form-encoded data (most compatible with Apps Script)
  try {
    console.log('Strategy 1: POST with form-encoded data');
    const formData = new URLSearchParams();
    Object.entries(requestData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Strategy 1 success:', result);
      return result;
    } else {
      console.log('Strategy 1 failed with status:', response.status);
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.log('Strategy 1 error:', error);
  }

  // Strategy 2: GET request (fallback)
  try {
    console.log('Strategy 2: GET request');
    const params = new URLSearchParams(requestData as Record<string, string>);
    const getResponse = await fetch(`${APPS_SCRIPT_URL}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (getResponse.ok) {
      const result = await getResponse.json();
      console.log('Strategy 2 success:', result);
      return result;
    } else {
      console.log('Strategy 2 failed with status:', getResponse.status);
      throw new Error(`HTTP ${getResponse.status}`);
    }
  } catch (error) {
    console.log('Strategy 2 error:', error);
  }

  // Strategy 3: POST with no-cors mode (last resort)
  try {
    console.log('Strategy 3: POST with no-cors mode');
    const formData = new URLSearchParams();
    Object.entries(requestData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    console.log('Strategy 3: Request sent (no-cors mode)');
    return { status: 'success', message: 'Request sent successfully' };
  } catch (error) {
    console.error('All strategies failed:', error);
    return { error: 'Failed to connect to server: ' + error };
  }
}

interface DocumentRequest {
  empId?: string;
  empName?: string;
  docName: string;
  reason: string;
  timestamp: string;
  status: string;
  fileId?: string;
  downloadLink?: string;
}

interface Payslip {
  name: string;
  date: string;
  link: string;
}

interface ApiResponse {
  status?: string;
  data?: DocumentRequest[] | Payslip[];
  error?: string;
  message?: string;
  rawResponse?: string;
}

const Requests = () => {
  const navigate = useNavigate();
  const [documentType, setDocumentType] = useState('Experience Certificate');
  const [reason, setReason] = useState('');
  const [otherDocName, setOtherDocName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get configuration from localStorage - handle both correct and typo versions
  const spreadsheetId = localStorage.getItem('spreadsheetId') || localStorage.getItem('spreadsheeetId');
  const empId = localStorage.getItem('empId') || localStorage.getItem('userId');
  const userEmail = localStorage.getItem('userEmail') || '';
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Employee');

  // Debug logging
  console.log('Configuration Check:', {
    spreadsheetId: spreadsheetId ? 'Found' : 'Missing',
    empId: empId ? 'Found' : 'Missing',
    spreadsheetIdValue: spreadsheetId,
    empIdValue: empId
  });

  const [requestHistory, setRequestHistory] = useState<DocumentRequest[]>([]);
  const [approvedDocs, setApprovedDocs] = useState<DocumentRequest[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [payslipError, setPayslipError] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
const profileRef = useRef<HTMLDivElement>(null);

// Close dropdown when clicking outside
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
      setIsProfileOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


  // Test API connection
  const testConnection = async () => {
    setTestResult('Testing connection...');
    const result = await callAppsScript('test');
    if (result.error) {
      setTestResult(`❌ Connection failed: ${result.error}`);
    } else {
      setTestResult(`✅ Connection successful: ${result.message}`);
    }
  };

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      if (!spreadsheetId) {
        setConnectionError('Spreadsheet ID not found. Please ensure it is configured in localStorage.');
        setLoading(false);
        return;
      }

      if (!empId) {
        setConnectionError('Employee ID not found. Please ensure userId is configured in localStorage.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setConnectionError('');
      
      console.log('Loading data with config:', { spreadsheetId, empId });
      
      try {
        // Load all request history (both pending and processed)
        const historyResponse = await callAppsScript('getAllHistory');
        console.log('History response:', historyResponse);
        if (historyResponse.error && historyResponse.error.includes('CORS')) {
          setConnectionError('CORS issue detected. Please ensure the Google Apps Script is properly configured with CORS headers.');
        }
        if (historyResponse.data) {
          setRequestHistory(historyResponse.data as DocumentRequest[]);
        }

        // Load approved documents (includes both spreadsheet and Drive documents)
        const approvedResponse = await callAppsScript('getApprovedDocs');
        console.log('Approved docs response:', approvedResponse);
        if (approvedResponse.data) {
          setApprovedDocs(approvedResponse.data as DocumentRequest[]);
        }

        // Load payslips from employee's Drive folder
        const payslipsResponse = await callAppsScript('getPayslips');
        console.log('Payslips response:', payslipsResponse);
        if (payslipsResponse.data && Array.isArray(payslipsResponse.data) && payslipsResponse.data.length > 0) {
          setPayslips(payslipsResponse.data as Payslip[]);
          setPayslipError('');
        } else if (payslipsResponse.message) {
          // Handle informational messages from backend
          setPayslipError(payslipsResponse.message);
        } else if (payslipsResponse.error) {
          console.error('Payslips error:', payslipsResponse.error);
          if (payslipsResponse.error.includes('CORS') || payslipsResponse.error.includes('fetch')) {
            setPayslipError('Connection issue - please check CORS configuration');
          } else {
            setPayslipError(payslipsResponse.error);
          }
        } else {
          setPayslipError(`No payslips found for employee ${empId} in the last 6 months`);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setConnectionError('Failed to connect to the backend service');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [spreadsheetId, empId]);

  const handleDocumentRequestSubmit = async () => {
    if (!reason.trim() || !documentType.trim() || (documentType === 'Others' && !otherDocName.trim())) {
      alert('⚠️ Please fill all fields before submitting.');
      return;
    }

    if (!spreadsheetId) {
      alert('⚠️ Spreadsheet ID missing. Please ensure it is configured.');
      return;
    }

    if (!empId) {
      alert('⚠️ Employee ID missing. Please ensure userId is configured.');
      return;
    }

    setSubmitting(true);
    try {
      const docName = documentType === 'Others' ? otherDocName : documentType;
      const response = await callAppsScript('addRequest', {
        docName,
        reason
      });

      console.log('Submit response:', response);

      if (response.status === 'success') {
        setSubmitted(true);
        setReason('');
        setOtherDocName('');
        setTimeout(() => setSubmitted(false), 3000);
        
        // Refresh the request history
        const historyResponse = await callAppsScript('getAllHistory');
        if (historyResponse.data) {
          setRequestHistory(historyResponse.data as DocumentRequest[]);
        }
      } else {
        alert('❌ Failed to submit request: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('❌ Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHistory = requestHistory.filter(
    (item) =>
      item.docName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApproved = approvedDocs.filter(
    (item) =>
      item.docName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (link: string, fileName: string) => {
    window.open(link, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
  <div className="flex items-center gap-3">
    <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
    <div>
      <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
      <p className="text-base font-semibold text-gray-600">Document Request</p>
    </div>
  </div>

  <div className="flex items-center space-x-6">
    <span className="text-lg font-bold text-green-700">EMPWR</span>

    <button
  onClick={() => navigate('/notifications')}
  className="relative text-green-800 hover:text-green-900"
>
  <Bell className="h-5 w-5" />
</button>


    {/* Profile Dropdown (Click-based) */}
    <div className="relative" ref={profileRef}>
      <button
        onClick={() => setIsProfileOpen(prev => !prev)}
        className="w-10 h-10 flex items-center justify-center hover:bg-green-100 rounded-full"
      >
        <User className="w-5 h-5 text-green-700" />
      </button>

      {isProfileOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg z-50">
          <button
            onClick={() => {
              navigate('/profile');
              setIsProfileOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-gray-800 hover:bg-green-50 flex items-center gap-2"
          >
            <UserCircle className="w-4 h-4 text-green-600" />
            View Profile
          </button>
        </div>
      )}
    </div>

    <button
      onClick={() => navigate('/dashboard')}
      className="text-green-700 hover:bg-green-100 p-2 rounded-full transition"
    >
      <Home className="h-5 w-5" />
    </button>
  </div>
</header>


      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {!spreadsheetId || !empId ? (
          <div className="text-center py-10">
            <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-600 font-medium mb-4">⚠️ Configuration Missing</p>
              <div className="text-sm text-gray-700 space-y-2">
                <p>Missing configuration:</p>
                <ul className="list-disc list-inside text-left">
                  {!spreadsheetId && <li>Spreadsheet ID (check localStorage 'spreadsheetId' or 'spreadsheeetId')</li>}
                  {!empId && <li>Employee ID (check localStorage 'empId' or 'userId')</li>}
                </ul>
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                  <p className="font-medium">Current values:</p>
                  <p>SpreadsheetId: {spreadsheetId || 'Not found'}</p>
                  <p>EmpId: {empId || 'Not found'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {connectionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  <strong>Connection Issue:</strong> {connectionError}
                </p>
                <p className="text-red-600 text-xs mt-1">
                  Make sure the Google Apps Script backend is deployed and accessible.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={testConnection}
                >
                  Test Connection
                </Button>
                {testResult && (
                  <p className="text-sm mt-2">{testResult}</p>
                )}
              </div>
            )}
            
            <div className="flex justify-center">
              <Input
                className="w-full max-w-7xl rounded-full px-4 py-2"
                placeholder="Search document type or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          <div className="space-y-6 flex flex-col h-full">
            <Card className="shadow-md h-[420px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-green-700 text-lg flex gap-2 items-center">
                  <FileText className="w-5 h-5" /> Document Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  aria-label="Select document type"
                >
                  <option value="Experience Certificate">Experience Certificate</option>
                  <option value="Salary Certificate">Salary Certificate</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Joining Letter">Joining Letter</option>
                  <option value="ITR">ITR (Form 16/16B)</option>
                  <option value="Others">Others</option>
                </select>

                {documentType === 'Others' && (
                  <Input
                    placeholder="Enter Document Name"
                    value={otherDocName}
                    onChange={(e) => setOtherDocName(e.target.value)}
                  />
                )}

                <Textarea
                  placeholder="Reason for the request"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />

                <Button
                  className="bg-green-600 text-white w-full"
                  onClick={handleDocumentRequestSubmit}
                  disabled={submitting}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
                {submitted && (
                  <p className="text-green-600 text-sm mt-2">✅ Request submitted successfully!</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md h-[320px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-green-700 text-lg flex gap-2 items-center">
                  <FileText className="w-5 h-5" /> Payslips (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 overflow-y-auto flex-1">
                {loading ? (
                  <p className="text-sm text-gray-500">Loading payslips...</p>
                ) : payslipError ? (
                  <div className="text-sm">
                    <p className="text-red-600">Error: {payslipError}</p>
                    <p className="text-gray-500 mt-1">Employee ID: {empId}</p>
                  </div>
                ) : payslips.length > 0 ? (
                  payslips.map((payslip, index) => (
                    <div key={index} className="flex justify-between items-center border-b py-2">
                      <div>
                        <p className="font-medium">{payslip.name}</p>
                        <p className="text-sm text-gray-600">{payslip.date}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex gap-2 items-center"
                        onClick={() => handleDownload(payslip.link, payslip.name)}
                      >
                        <Download className="w-4 h-4" /> Download
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm">
                    <p className="text-gray-500">No payslips available.</p>
                    <p className="text-xs text-gray-400 mt-1">Employee ID: {empId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6 flex flex-col h-full">
            <Card className="shadow-md h-[420px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-green-800 text-md">Approved Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 overflow-y-auto max-h-[340px] pr-2">
                {loading ? (
                  <p className="text-sm text-gray-500">Loading approved documents...</p>
                ) : filteredApproved.length > 0 ? (
                  filteredApproved.map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b py-2">
                      <div>
                        <p className="font-medium">{doc.docName}</p>
                        <p className="text-sm text-gray-600">{doc.reason}</p>
                        <p className="text-xs text-gray-500">{new Date(doc.timestamp).toLocaleDateString()}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex gap-2 items-center"
                        onClick={() => handleDownload(doc.downloadLink || '', doc.docName)}
                      >
                        <Download className="w-4 h-4" /> Download
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No approved documents available.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md flex-1">
              <CardContent className="p-6 max-h-[320px] overflow-y-auto">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">All Document Requests</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto text-sm text-left">
                    <thead>
                      <tr className="bg-slate-100 text-gray-700">
                        <th className="p-3">Document Type</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Requested</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-500">
                            Loading requests...
                          </td>
                        </tr>
                      ) : filteredHistory.length > 0 ? (
                        filteredHistory.map((req, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3">{req.docName}</td>
                            <td className="p-3">{req.reason}</td>
                            <td className="p-3">{new Date(req.timestamp).toLocaleString()}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  req.status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : req.status === 'Approved'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-500">
                            No document requests found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </>
        )}
      </main>
    </div>
  );
};

export default Requests;