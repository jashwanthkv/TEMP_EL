import React, { useState, useRef, useEffect } from 'react';

import {
  HelpCircle,
  FileText,
  Mail,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Ticket from './Ticket'; // ✅ Adjust path if needed
import { Button } from '@/components/ui/button';
import { Home, Bell, User, UserCircle } from 'lucide-react';

const Help = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = [
    {
      title: 'Ticket Management',
      icon: <HelpCircle className="h-5 w-5 text-orange-500" />,
      description: 'View and manage submitted support tickets.',
      content: <Ticket />,
    },
    {
      title: 'User Guide',
      icon: <FileText className="h-5 w-5 text-green-600" />,
      description: 'Step-by-step guide on using the CodeBlox portal.',
      content: (
        <div>
          <h1 className="text-2xl font-semibold mb-2">User Guide</h1>
          <p className="text-gray-600">
            This guide walks you through every section of the portal and how to use its features effectively.
          </p>
        </div>
      ),
    },
    {
      title: 'Contact Support',
      icon: <Mail className="h-5 w-5 text-purple-600" />,
      description: 'Need help? Contact our support team.',
      content: (
        <div>
          <h1 className="text-2xl font-semibold mb-2">Contact Support</h1>
          <p className="text-gray-600">
            Reach out to our support team through our contact form or support email.
          </p>
        </div>
      ),
    },
    {
      title: 'Logout',
      icon: <LogOut className="h-5 w-5 text-gray-700" />,
      description: 'Logout from your account.',
      action: () => {
        localStorage.clear();
        navigate('/');
      },
    },
  ];

  const [selectedItem, setSelectedItem] = useState(items[0]);

  const handleItemClick = (item) => {
    if (item.title === 'Logout') {
      item.action();
    } else {
      setSelectedItem(item);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-lg font-bold text-green-700 leading-none">EPICAL LAYOUTS PVT LTD</p>
            <p className="text-base font-semibold text-gray-600">Help & Support</p>
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

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full max-w-xs bg-white border-r overflow-auto">
          <div className="grid grid-cols-1 gap-3 p-4">
            {items.map((item, index) => (
              <div
                key={index}
                onClick={() => handleItemClick(item)}
                className={`flex items-start p-4 space-x-3 rounded-2xl cursor-pointer transition-all border 
                  ${
                    selectedItem.title === item.title
                      ? 'bg-gray-100 border-gray-300 shadow-sm'
                      : 'border-gray-100 hover:shadow-md hover:bg-gray-50'
                  }`}
              >
                <div>{item.icon}</div>
                <div>
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto bg-white">
          <div className="space-y-6">
            {/* Display title and separator */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-800">{selectedItem.title}</h2>
              <p className="text-sm text-gray-500">{selectedItem.description}</p>
            </div>

            {/* Actual Content */}
            <div>{selectedItem.content}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Help;
