import { initializeApp } from "firebase/app";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Firebase Config
import { config } from "./config/config";
initializeApp(config.firebaseConfig);

// Pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import AdminProfilePanel from "./pages/AdminProfile"; 
import Profile from "./pages/Profile";
import LeaveManagement from "./pages/LeaveManagement";
import Notifications from "./pages/Notifications";
import Timesheet from "./pages/Timesheet";

import Requests from "./pages/Requests";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import ManageEmployees from "./pages/ManageEmployees";
import EmployeeCalendar from "./pages/CompanyCalendar";
import TrainingCourses from "./pages/TrainingCourses";
import PerformanceReview from "./pages/PerformanceReview";
import CompanyAchievements from "./pages/CompanyAchievements";
import Ticket from "./pages/Ticket";

// Admin Features
import AdminLeaveManager from "./pages/AdminLeaveManager";
import UploadPayslips from "./pages/UploadPayslips";
import AdminAnalytics from "./pages/AdminAnalytics";

import AdminSettings from "./pages/AdminSettings";
import AdminCalendar from "./pages/AdminCompanyCalendar";
import AdminTrainingCourses from "./pages/AdminTrainingCourses";
import AdminPerformanceReview from "./pages/AdminPerformanceReview";
import AdminNotifications from "./pages/AdminNotifications";
import AdminCompanyAchievements from "./pages/AdminCompanyAchievements";
import AdminTicket from "./pages/AdminTicket";
import AdminManageNews from "./pages/AdminManageNews"; // ✅ ADDED
import AdminTimesheet from "./pages/AdminTimesheet";
import AdminProject from './pages/AdminProject'; 
// In main index.tsx or App.tsx



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leave" element={<LeaveManagement />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/timesheet" element={<Timesheet />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/help" element={<Help />} />
          <Route path="/calendar" element={<EmployeeCalendar />} />
          <Route path="/training" element={<TrainingCourses />} />
          <Route path="/Performance" element={<PerformanceReview />} />
          <Route path="/company" element={<CompanyAchievements />} />
          <Route path="/ticket" element={<Ticket />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/profile" element={<AdminProfilePanel />} /> {/* ✅ NEW ROUTE */}
          <Route path="/admin/leaves" element={<AdminLeaveManager />} />
          <Route path="/admin/payslips" element={<UploadPayslips />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/manage-employees" element={<ManageEmployees />} />
          <Route path="/admin/calendar" element={<AdminCalendar />} />
          <Route path="/admin/training" element={<AdminTrainingCourses />} />
          <Route path="/admin/performance" element={<AdminPerformanceReview />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/company" element={<AdminCompanyAchievements />} />
          <Route path="/admin/ticket" element={<AdminTicket />} />
          <Route path="/admin/news" element={<AdminManageNews />} />
          <Route path="/admin/timesheet" element={<AdminTimesheet/>}/>
          <Route path="/admin/project" element={<AdminProject />} />

          

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
