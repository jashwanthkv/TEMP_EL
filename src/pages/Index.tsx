
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';


const url = 'https://script.google.com/macros/s/AKfycbwMtbaiE6ETKlIt9AobORBLiysqKnXxCwt8wcnOosq0OTdzNYiV1kFB85OvU9EjLbfXuQ/exec';

const Index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authing, setAuthing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = getAuth();
  const { login, isAuthenticated } = useAuth();
  const googleProvider = new GoogleAuthProvider();
  // Index page is login, so no RequireLogin needed here

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLower = email.toLowerCase();

    if (!emailLower.endsWith('@gmail.com')) {
      toast({
        title: 'Invalid Email',
        description: 'Only Gmail addresses are allowed',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Fetch employee data from backend using proxy
      console.log('Making request to:', `${url}?email=${emailLower}&password=${password}`);
      
      const response = await fetch(
        `${url}?email=${encodeURIComponent(emailLower)}&password=${encodeURIComponent(password)}`
      );
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Backend response:', data);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        console.log('Response appears to be HTML. First 500 characters:', responseText.substring(0, 500));
        toast({
          title: 'Server Error',
          description: 'Server returned an invalid response. Please check if the backend is properly configured.',
          variant: 'destructive',
        });
        return;
      }

      if (data.current && data.current.length > 0) {
        const employee = data.current[0];
        console.log('Employee data:', employee);
        
        const role = employee.ROLE || 'Employee';
        const displayName = employee.EMP_NAME || emailLower.split('@')[0];
        const empId = employee.EMP_ID || 'EMP001';
        const spreadsheetId = employee.SHEETID || '';
        const status = employee.STATE || '';
        const emptype = employee.ROLE ||'';

        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', displayName);
        localStorage.setItem('userEmail', emailLower);
        localStorage.setItem('userId', empId);
        localStorage.setItem('userPassword', password); // Store password for backend authentication
        localStorage.setItem('userStatus', status);
        localStorage.setItem('userRole', emptype)
          
        // Store spreadsheet ID if available
        if (spreadsheetId) {
          localStorage.setItem('spreadsheetId', spreadsheetId);
          console.log('Stored spreadsheet ID:', spreadsheetId);
        }

        // Store additional employee details for dashboard
        if (employee.POSITION) {
          localStorage.setItem('userDesignation', employee.POSITION);
        }
        if (employee.DEPT) {
          localStorage.setItem('userDepartment', employee.DEPT);
        }
        if (employee.JOINED || employee.JOINING_DATE || employee.DOJ) {
          const joinDate = employee.JOINED || employee.JOINING_DATE || employee.DOJ;
          localStorage.setItem('userJoinedOn', joinDate);
        }
        
        // Store full employee profile for reference
        localStorage.setItem('employeeProfile', JSON.stringify(employee));

        // Use leave summary from login response since it already includes the correct data
        if (data.leave_summary && !data.leave_summary.error) {
          localStorage.setItem('leaveSummary', JSON.stringify(data.leave_summary));
          console.log('Stored leave summary from login response');
          console.log('Leave summary details:');
          console.log('- Casual Leave:', data.leave_summary.casual || 'N/A');
          console.log('- Sick Leave:', data.leave_summary.sick || 'N/A');
          console.log('- Earned Leave:', data.leave_summary.earned || 'N/A');
          console.log('- CST:', data.leave_summary.cst || 'N/A');
          console.log('- ST:', data.leave_summary.st || 'N/A');
          console.log('- ET:', data.leave_summary.et || 'N/A');
          console.log('Stored data:', JSON.stringify(data.leave_summary, null, 2));
        }

        toast({
          title: 'Login Successful',
          description: `Welcome ${displayName} to EMPWR Portal`,
        });

        // Navigate based on exact role from backend
        if (role && role.toLowerCase() === 'admin') {
            await login(emailLower, password);
            navigate('/admin', { replace: true });
          } else {
            await login(emailLower, password);
            navigate('/dashboard', { replace: true });
          }
      } else {
        toast({
          title: 'Invalid Credentials',
          description: 'Email or password is incorrect',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and restart the dev server.';
      } else if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = 'Connection blocked. Please restart the development server.';
        } else if (error.message.includes('HTTP')) {
          errorMessage = `Server error: ${error.message}. Please check your Google Apps Script.`;
        }
      }
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const signInWithGoogle = async () => {
    const emailLower = email.toLowerCase();
    setAuthing(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email?.toLowerCase() || '';

      if (!userEmail.endsWith('@gmail.com')) {
        toast({
          title: 'Access Denied',
          description: 'Only Gmail addresses are allowed',
          variant: 'destructive',
        });
        return;
      }

      // Fetch employee data from Google auth using proxy
      console.log('Making Google auth request to:', `${url}?email=${userEmail}&password=google_auth`);
      
      const response = await fetch(`${url}?email=${encodeURIComponent(userEmail)}&password=google_auth`);
      
      console.log('Google auth response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('Google auth raw response text:', responseText);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Google auth backend response:', data);
      } catch (parseError) {
        console.error('Failed to parse Google auth response as JSON:', parseError);
        console.log('Response appears to be HTML. First 500 characters:', responseText.substring(0, 500));
        toast({
          title: 'Server Error',
          description: 'Server returned an invalid response during Google sign-in. Please check if the backend is properly configured.',
          variant: 'destructive',
        });
        return;
      }

      if (data.current && data.current.length > 0) {
        const employee = data.current[0];
        console.log('Google auth employee data:', employee);
        
        const role = employee.ROLE || 'Employee';
        const displayName = employee.EMP_NAME || result.user.displayName || userEmail.split('@')[0];
        const empId = employee.EMP_ID || 'EMP001';
        const spreadsheetId = employee.SHEETID || '';

        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', displayName);
        localStorage.setItem('userEmail', userEmail);
        localStorage.setItem('userId', empId);
        localStorage.setItem('userPassword', 'google_auth'); // Store Google auth token for backend authentication
        
        // Store spreadsheet ID if available
        if (spreadsheetId) {
          localStorage.setItem('spreadsheetId', spreadsheetId);
          console.log('Stored spreadsheet ID from Google auth:', spreadsheetId);
        }

        // Store additional employee details for dashboard
        if (employee.DESIGNATION) {
          localStorage.setItem('userDesignation', employee.DESIGNATION);
        }
        if (employee.DEPARTMENT) {
          localStorage.setItem('userDepartment', employee.DEPARTMENT);
        }
        if (employee.JOINED_ON || employee.JOINING_DATE || employee.DOJ) {
          const joinDate = employee.JOINED_ON || employee.JOINING_DATE || employee.DOJ;
          localStorage.setItem('userJoinedOn', joinDate);
        }
        
        // Store full employee profile for reference
        localStorage.setItem('employeeProfile', JSON.stringify(employee));

        //  leave summary from Google auth response since it already includes the correct data
        if (data.leave_summary && !data.leave_summary.error) {
          localStorage.setItem('leaveSummary', JSON.stringify(data.leave_summary));
          console.log('Stored leave summary from Google auth response');
          console.log('Google auth leave summary details:');
          console.log('- Casual Leave:', data.leave_summary.casual || 'N/A');
          console.log('- Sick Leave:', data.leave_summary.sick || 'N/A');
          console.log('- Earned Leave:', data.leave_summary.earned || 'N/A');
          console.log('- CST:', data.leave_summary.cst || 'N/A');
          console.log('- ST:', data.leave_summary.st || 'N/A');
          console.log('- ET:', data.leave_summary.et || 'N/A');
          console.log('Stored data (Google auth):', JSON.stringify(data.leave_summary, null, 2));
        }

        toast({
          title: 'Login Successful!',
          description: `Welcome ${displayName}`,
        });

        // Navigate based on exact role from backend
        if (role && role.toLowerCase() === 'admin') {
          await login(emailLower, password);
          navigate('/admin', { replace: true });
        } else {
          await login(emailLower, password);
          navigate('/dashboard', { replace: true });
        }
      } else {
        toast({
          title: 'Access Denied',
          description: 'User not registered in the system',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      
      let errorMessage = 'Something went wrong during Google Sign-In';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error during Google Sign-In. Please check your connection.';
      } else if (error instanceof Error && error.message.includes('CORS')) {
        errorMessage = 'Connection blocked during Google Sign-In. Please restart the development server.';
      }
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setAuthing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <img
              src="/logos.png"
              alt="EMPWR Logo"
              className="mx-auto w-16 h-16 object-contain mb-2"
            />
            <h1 className="text-2xl font-bold text-green-800">EMPWR</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 border-gray-300 focus:border-green-500"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 border-gray-300 focus:border-green-500"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-green-400 via-green-500 to-green-700 text-white font-semibold rounded-lg hover:from-green-500 hover:to-green-800 transition-all duration-300"
            >
              Sign In with Email
            </Button>

            <div className="relative my-6">
              <Separator className="bg-gray-300" />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-gray-500 text-sm">
                OR
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={signInWithGoogle}
              disabled={authing}
              className="w-full h-12 text-gray-700 font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-green-100 via-white to-green-100 border border-gray-300 hover:from-green-200 hover:to-white"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google Logo"
                className="w-5 h-5"
              />
              {authing ? 'Signing in...' : 'Continue with Google'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* === COPYRIGHT FOOTER SECTION === */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        <p className="mb-2">© Epical Layouts™ 2025 - All rights reserved</p>
        
      </div>
    </div>
  );
};

export default Index;