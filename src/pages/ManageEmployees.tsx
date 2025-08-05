// JSONP utility for Apps Script CORS workaround
function jsonpRequest(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = "jsonp_callback_" + Math.round(100000 * Math.random());
    (window as any)[callbackName] = (data: any) => {
      resolve(data);
      delete (window as any)[callbackName];
      document.body.removeChild(script);
    };
    const script = document.createElement("script");
    script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + callbackName;
    script.onerror = () => {
      reject(new Error("JSONP request failed"));
      delete (window as any)[callbackName];
      document.body.removeChild(script);
    };
    document.body.appendChild(script);
  });
}

import React, { useState, useEffect, useRef } from 'react';
import RequireLogin from '@/components/ui/RequireLogin';
// Backend API URL
const EMPLOYEE_API_URL = "https://script.google.com/macros/s/AKfycbwMY8qPpC1ZrED-gTz0BTIezkgP1T40dafonNSyupOYktzRhIYYcNXns8h14QB9YskL/exec";

// Map frontend EmployeeData to backend parameter names for add
function mapToBackendParams(data: EmployeeData) {
  return {
    empId: data.employeeId,
    FirstName: data.firstName,
    lastName: data.lastName,
    designation: data.designation,
    department: data.department,
    cMailId: data.companyEmail,
    password: "123456",
    MobileNo: data.mobile,
    JoiningDate: data.joiningDate,
    role: data.role,
    status: data.status || "active",
    gender: data.gender,
    dateOfBirth: data.dob,
    pMailId: data.personalEmail,
    communicationAddress: data.address,
    PANCard: data.pan,
    AadhaarCard: data.aadhar,       // ✅ FIXED spelling
    BankName: data.bankName,
    BankAccount: data.bankAccount,
    IFSC: data.ifscCode,
    SalaryGrade: data.salaryGrade,
    UAN: data.uanNumber,
    PF_ESI_Status: data.pfEsiStatus,
    manager: data.reportingManager,
    passport: data.passport,        // ✅ FIXED capital 'P'
    ctc: data.ctc,
    Type: data.employmentType || 'full-time',
  };
}
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Bell, User, UserCircle } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

type EmployeeData = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  mobile: string;
  personalEmail: string;
  companyEmail: string;
  address: string;
  bankName: string;
  bankAccount: string;
  ifscCode: string;
  salaryGrade: string;
  uanNumber: string;
  pfEsiStatus: string;
  joiningDate: string;
  employmentType: string;
  designation: string;
  department: string;
  reportingManager: string;
  role: string;
  employeeId: string;
  aadhar: string;
  pan: string;
  passport: string;
  ctc: string;
  status?: string;
};

let initialData: EmployeeData = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: '',
  mobile: '',
  personalEmail: '',
  companyEmail: '',
  address: '',
  bankName: '',
  bankAccount: '',
  ifscCode: '',
  salaryGrade: '',
  uanNumber: '',
  pfEsiStatus: '',
  joiningDate: '',
  employmentType: '',
  designation: '',
  department: '',
  reportingManager: '',
  role: 'employee',
  employeeId: '',
  aadhar: '',
  pan: '',
  passport: '',
  ctc: '',
  status: 'active',
};

type FormType = 'add' | 'update';

const ManageEmployees = () => {
  if (!localStorage.getItem('userEmail')) {
    return <RequireLogin />;
  }
  const navigate = useNavigate();
  const [formType, setFormType] = useState<FormType>('add');
  const [employeeData, setEmployeeData] = useState<EmployeeData>({ ...initialData });
  const [updateId, setUpdateId] = useState('');
  const [employeeList, setEmployeeList] = useState<{id: string, name: string}[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [employeeCache, setEmployeeCache] = useState<{ [id: string]: EmployeeData }>({});
  const [formSubmitting, setFormSubmitting] = useState(false); // For add/update button
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (formType === 'update') {
      fetchEmployeeList();
    }
  }, [formType]);
  function formatDateToInput(dateString: string) {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0]; // formats to yyyy-MM-dd
  }


  const fetchEmployeeList = async () => {
  setLoadingEmployees(true);
  try {
    const url = EMPLOYEE_API_URL + `?action=getEmployeeList`;
    const res = await fetch(url); // 🔁 using fetch, not jsonpRequest
    const data = await res.json();
    
    if (data.status === "success") {
      setEmployeeList(data.employees.map((emp: any) => ({
        id: emp.empId,
        name: emp.name
      })));
    } else {
      alert("Failed to fetch employee list");
    }
  } catch (err) {
    alert("Error fetching employee list");
  } finally {
    setLoadingEmployees(false);
  }
};


  const handleChange = (field: keyof EmployeeData, value: string) => {
    setEmployeeData(prev => ({ ...prev, [field]: value }));
  };

  const handleFetch = async (selectedId: string) => {
  setUpdateId(selectedId); // store the selected ID (if needed elsewhere)

  // ✅ Check cache first
  if (employeeCache[selectedId]) {
    setEmployeeData(employeeCache[selectedId]);
    return;
  }

  const url = EMPLOYEE_API_URL + `?action=getEmployeeById&id=${encodeURIComponent(selectedId)}`;
  try {
    const data = await fetch(url).then(res => res.json()); // changed from jsonpRequest
    if (data.status === "found") {
      const fetchedData: EmployeeData = {
        ...initialData,
        firstName: data.employee.FirstName || '',
        lastName: data.employee.lastName || '',
        dob: formatDateToInput(data.employee.dateOfBirth),
        gender: data.employee.gender || '',
        mobile: String(data.employee.MobileNo || ''),
        personalEmail: data.employee.pMailId || '',
        companyEmail: data.employee.cMailId || '',
        address: data.employee.communicationAddress || '',
        bankName: data.employee.BankName || '',
        bankAccount: String(data.employee.BankAccount || ''),
        ifscCode: data.employee.IFSC || '',
        salaryGrade: data.employee.SalaryGrade || '',
        uanNumber: String(data.employee.UAN || ''),
        pfEsiStatus: data.employee.PF_ESI_Status || '',
        joiningDate: formatDateToInput(data.employee.JoiningDate),
        employmentType: data.employee.Type || '',
        designation: data.employee.designation || '',
        department: data.employee.department || '',
        reportingManager: data.employee.manager || '',
        role: data.employee.role || 'employee',
        employeeId: String(data.employee.empId || ''),
        ctc: String(data.employee.Ctc || ''),
        aadhar: String(data.employee.AadhaarCard || ''),
        pan: data.employee.PANCard || '',
        passport: String(data.employee.Passport || ''),
        status: data.employee.status || 'inactive',

      };


      // ✅ Set form data
      setEmployeeData(fetchedData);

      // ✅ Cache the result
      setEmployeeCache(prev => ({ ...prev, [selectedId]: fetchedData }));
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Failed to fetch employee details.");
  }
};


  const handleSubmit = async () => {
  setFormSubmitting(true); // Start loader
  const params = formType === 'add'
    ? { action: "addEmployee", ...mapToBackendParams(employeeData) }
    : {
        action: "update",
        id: updateId,
        empName: employeeData.firstName,
        last: employeeData.lastName,
        position: employeeData.designation,
        dept: employeeData.department,
        email: employeeData.companyEmail,
        password: "123456",
        phone: employeeData.mobile,
        joined: employeeData.joiningDate,
        role: employeeData.role,
        state: employeeData.status || "inactive",
        gender: employeeData.gender,
        dob: employeeData.dob,
        pEmail: employeeData.personalEmail,
        address: employeeData.address,
        pan: employeeData.pan,
        aadhar: employeeData.aadhar,
        bankName: employeeData.bankName,
        accountNumber: employeeData.bankAccount,
        ifsc: employeeData.ifscCode,
        payLevel: employeeData.salaryGrade,
        uan: employeeData.uanNumber,
        pf: employeeData.pfEsiStatus,
        reportingManager: employeeData.reportingManager,
        passport: employeeData.passport,
        ctc: employeeData.ctc,
        type: employeeData.employmentType || 'full-time',
      };

  const url = EMPLOYEE_API_URL + "?" + new URLSearchParams(params).toString();

  try {
    const res = await fetch(url);
    const data = await res.json();
    alert(data.message);
  } catch (err) {
    alert(formType === 'add' ? "Failed to add employee." : "Failed to update employee.");
  } finally {
    setFormSubmitting(false); // End loader
  }
};


  // const handleStatusChange = async (newStatus: string) => {
  //   if (!updateId) return;
    
  //   const params = {
  //     action: "freeze",
  //     id: updateId,
  //     status: newStatus
  //   };
    
  //   const url = EMPLOYEE_API_URL + "?" + new URLSearchParams(params).toString();
  //   try {
  //     const res = await fetch(url);
  //     let data=await res.json();
  //     alert(data.message);
  //     await handleFetch(updateId);
  //   } catch (err) {
  //     alert("Failed to change employee status.");
  //   }
  // };

  const handleStateChange = async () => {
    if (!updateId) return;

    const newStatus = employeeData.status === 'active' ? 'inactive' : 'active';

    const params = {
      action: "active", // ✅ Make sure this matches your Apps Script `doGet`
      id: updateId,
      status: newStatus
    };

    const url = EMPLOYEE_API_URL + "?" + new URLSearchParams(params).toString();

    try {
      const data = await jsonpRequest(url); // ✅ Use JSONP instead of fetch
      alert(data.message);

      // ✅ Update local state after success
      setEmployeeData(prev => ({
        ...prev,
        status: newStatus
      }));
    } catch (err) {
      alert("Failed to update status.");
      console.error("Error updating status:", err);
    }
  };



  const isFormValid = employeeData.firstName && employeeData.lastName && employeeData.employeeId;

  const renderInput = (label: string, field: keyof EmployeeData, type = 'text') => {
    const isFilled = !!employeeData[field];
    return (
      <div className="flex flex-col gap-1 w-full">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <Input
          type={type}
          className={`rounded-xl border shadow-sm focus:ring-green-500 focus:border-green-500 ${
            isFilled ? 'border-green-500' : 'border-gray-300'
          }`}
          value={employeeData[field]}
          onChange={e => handleChange(field, e.target.value)}
        />
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen overflow-x-hidden">
      {(formSubmitting || loadingEmployees) && (
  <div className="fixed top-0 left-0 w-full h-full bg-white/70 z-[9999] flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
  </div>
)}


      <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Manage Employees</p>
          </div>
        </div>
  
        <div className="flex items-center space-x-6">
          <span className="text-lg font-bold text-green-700">EMPWR</span>
          <button className="relative text-green-700 hover:text-green-800">
            <Bell className="h-5 w-5" />
          </button>
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
                    navigate('/admin/profile');
                    setIsProfileOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-800 hover:bg-green-50 flex items-center gap-2"
                >
                  <UserCircle className="w-4 h-4 text-green-600" /> View Profile
                </button>
              </div>
            )}
          </div>
          <button
            className="text-green-700 hover:bg-green-100 p-2 rounded-full transition"
            onClick={() => navigate('/admin')}
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4">
        <div className="flex gap-6 justify-center mt-6">
          <Button
            className={`rounded-full px-10 py-2 shadow-md hover:shadow-lg transition ${
              formType === 'add'
                ? 'bg-gradient-to-r from-green-500 to-green-700 text-white hover:bg-gradient-to-r hover:from-green-600 hover:to-green-800'
                : 'bg-gray-200 text-black hover:bg-gray-300'
            }`}
            onClick={() => {
              setFormType('add');
              setEmployeeData({ ...initialData });
            }}
          >
            Add Employee
          </Button>
          <Button
            className={`rounded-full px-10 py-2 shadow-md hover:shadow-lg transition ${
              formType === 'update'
                ? 'bg-gradient-to-r from-green-500 to-green-700 text-white hover:bg-gradient-to-r hover:from-green-600 hover:to-green-800'
                : 'bg-gray-200 text-black hover:bg-gray-300'
            }`}
            onClick={() => {
              setFormType('update');
              setEmployeeData({ ...initialData });
            }}
          >
            Update Employee
          </Button>
        </div>

        {formType === 'update' && (
          <Card className="rounded-2xl shadow-lg bg-white max-w-5xl mx-auto mt-6">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-sm font-medium text-gray-700">
                    Select Employee
                  </label>
                  <Select
                    value={updateId}
                    onValueChange={(value) => {
                      setUpdateId(value);
                      if (value) handleFetch(value); // ✅ fixed here
                    }}
                    disabled={loadingEmployees}
                  >
                    <SelectTrigger className="rounded-xl border-gray-300">
                      <SelectValue placeholder={loadingEmployees ? "Loading employees..." : "Select employee"} />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeList.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {`${emp.id}-${emp.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>
                <Button
  onClick={() => handleFetch(updateId)}
  disabled={!updateId || loadingEmployees}
  className={`text-white px-4 py-2 rounded-full shadow transition self-end ${
    updateId && !loadingEmployees
      ? 'bg-green-600 hover:bg-green-700'
      : 'bg-gray-300 cursor-not-allowed'
  }`}
>
  Fetch
</Button>

              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl shadow-lg bg-white max-w-5xl mx-auto mt-6">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-green-800 border-b pb-1">Basic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInput('First Name', 'firstName')}
              {renderInput('Last Name', 'lastName')}
              {renderInput('Date of Birth', 'dob', 'date')}
              {renderInput('Gender', 'gender')}
              {renderInput('Phone Number', 'mobile')}
              {renderInput('Personal Email', 'personalEmail')}
              {renderInput('Company Email', 'companyEmail')}
              {renderInput('Address', 'address')}
            </div>

            <h3 className="text-lg font-semibold text-green-800 border-b pb-1">Payroll Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInput('Bank Name', 'bankName')}
              {renderInput('Account Number', 'bankAccount')}
              {renderInput('IFSC Code', 'ifscCode')}
              {renderInput('Salary Grade', 'salaryGrade')}
              {renderInput('UAN Number', 'uanNumber')}
              {renderInput('PF/ESI Status', 'pfEsiStatus')}
            </div>

            <h3 className="text-lg font-semibold text-green-800 border-b pb-1">Joining Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInput('Joining Date', 'joiningDate', 'date')}
              {renderInput('Employment Type', 'employmentType')}
              {renderInput('Designation', 'designation')}
              {renderInput('Department', 'department')}
              {renderInput('Reporting Manager', 'reportingManager')}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <Select 
                  value={employeeData.role} 
                  onValueChange={value => handleChange('role', value)}
                >
                  <SelectTrigger className="rounded-xl border border-gray-300 shadow-sm">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderInput('Employee ID', 'employeeId')}
              {renderInput('CTC', 'ctc')}
            </div>

            <h3 className="text-lg font-semibold text-green-800 border-b pb-1">ID Proofs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInput('Aadhar Number', 'aadhar')}
              {renderInput('PAN Number', 'pan')}
              {renderInput('Passport Number', 'passport')}
            </div>
          </CardContent>
        </Card>

        <div className="max-w-5xl mx-auto mt-6 pb-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {formType === 'update' && employeeData.status && (
              <div className="flex gap-4 order-2 md:order-1 items-center">
                <Button
                  onClick={handleStateChange}
                  className={`rounded-full px-6 py-2 shadow-md transition ${
                    employeeData.status === 'inactive'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {employeeData.status === 'inactive' ? 'Activate' : 'Deactivate'}
                </Button>
              </div>
            )}

            <Button
  onClick={handleSubmit}
  disabled={!isFormValid || formSubmitting}
  className={`rounded-full px-8 py-2 shadow-md transition order-1 md:order-2 ${
    isFormValid && !formSubmitting
      ? 'bg-gradient-to-r from-green-500 to-green-700 text-white hover:bg-gradient-to-r hover:from-green-600 hover:to-green-800'
      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
  }`}
>
  {formType === 'add' ? 'Add' : 'Update'}
</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageEmployees;