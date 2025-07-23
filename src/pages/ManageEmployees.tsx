import React, { useState } from 'react';
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
  ctc: string;
  aadhaar: string;
  pan: string;
  passport: string;
  otherId: string;
};

const initialData: EmployeeData = {
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
  ctc: '',
  aadhaar: '',
  pan: '',
  passport: '',
  otherId: '',
};

const ManageEmployees = () => {
  const navigate = useNavigate();
  const [formType, setFormType] = useState<'add' | 'update'>('add');
  const [employeeData, setEmployeeData] = useState<EmployeeData>({ ...initialData });
  const [updateId, setUpdateId] = useState('');

  const handleChange = (field: keyof EmployeeData, value: string) => {
    setEmployeeData(prev => ({ ...prev, [field]: value }));
  };

  const handleFetch = () => {
    const mockData = {
      ...initialData,
      firstName: 'John',
      lastName: 'Doe',
      employeeId: updateId,
    };
    setEmployeeData(mockData);
  };

  const handleSubmit = () => {
    if (formType === 'add') {
      console.log('Submitting new employee:', employeeData);
    } else {
      console.log('Updating employee:', updateId, employeeData);
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
    <div className="bg-gray-50 min-h-screen">

      {/* Full-width Header */}
      <header className="w-screen bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
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

          <button
            onClick={() => navigate('/admin')}
            className="text-green-700 hover:bg-green-100 p-2 rounded-full transition"
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Toggle Buttons */}
      <div className="flex gap-6 justify-center mt-6">
        <Button
          className={`rounded-full px-10 py-2 shadow-md hover:shadow-lg transition ${
            formType === 'add'
              ? 'bg-gradient-to-r from-green-500 to-green-700 text-white'
              : 'bg-gray-200 text-black'
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
              ? 'bg-gradient-to-r from-green-500 to-green-700 text-white'
              : 'bg-gray-200 text-black'
          }`}
          onClick={() => {
            setFormType('update');
            setEmployeeData({ ...initialData });
          }}
        >
          Update Employee
        </Button>
      </div>

      {/* Update Section */}
      {formType === 'update' && (
        <Card className="rounded-2xl shadow-lg bg-white max-w-5xl mx-auto mt-6">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="flex flex-col gap-1 w-full">
                <label className="text-sm font-medium text-gray-700">Employee ID to Update</label>
                <Input
                  className="rounded-xl border-gray-300"
                  value={updateId}
                  onChange={e => setUpdateId(e.target.value)}
                />
              </div>
              <Button
                onClick={handleFetch}
                disabled={!updateId.trim()}
                className={`text-white px-4 py-2 rounded-full shadow transition self-end ${
                  updateId.trim()
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

      {/* Form Section */}
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
              <Select value={employeeData.role} onValueChange={value => handleChange('role', value)}>
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
            {renderInput('Aadhaar Number', 'aadhaar')}
            {renderInput('PAN Number', 'pan')}
            {renderInput('Passport Number', 'passport')}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-sm font-medium text-gray-700">Other ID Type</label>
              <Select value={employeeData.otherId} onValueChange={value => handleChange('otherId', value)}>
                <SelectTrigger className="rounded-xl border border-gray-300 shadow-sm">
                  <SelectValue placeholder="Select Other ID Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voter">Voter ID</SelectItem>
                  <SelectItem value="driving">Driving License</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="text-end max-w-5xl mx-auto mt-6 pb-10">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`rounded-full px-8 py-2 shadow-md transition ${
            isFormValid
              ? 'bg-gradient-to-r from-green-500 to-green-700 text-white hover:shadow-lg'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          {formType === 'add' ? 'Add' : 'Update'}
        </Button>
      </div>
    </div>
  );
};

export default ManageEmployees;
