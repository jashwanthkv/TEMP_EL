// src/components/NotificationBell.tsx
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const notifications = [
  { id: 1, message: "Leave approved by Admin" },
  { id: 2, message: "Payslip for June uploaded" },
  { id: 3, message: "New deadline for project Alpha" },
];

export default function NotificationBell() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/notifications');
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
    >
      <div
        className="cursor-pointer p-2"
        onClick={handleClick}
        title="View notifications"
      >
        <Bell className="w-5 h-5" />
      </div>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="p-3 font-semibold border-b">Notifications</div>
          <ul className="max-h-60 overflow-y-auto">
            {notifications.slice(0, 3).map((notif) => (
              <li
                key={notif.id}
                className="px-4 py-2 hover:bg-gray-100 text-sm text-gray-800"
              >
                {notif.message}
              </li>
            ))}
          </ul>
          <div className="p-2 text-center border-t">
            <span
              onClick={handleClick}
              className="text-blue-500 text-sm hover:underline cursor-pointer"
            >
              See more
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
