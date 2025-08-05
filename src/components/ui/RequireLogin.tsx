import React from 'react';

const RequireLogin: React.FC = () => {
  // Log localStorage state when this component renders
  console.log('RequireLogin component rendered');
  console.log('localStorage contents:', { ...localStorage });
  console.log('userEmail in localStorage:', localStorage.getItem('userEmail'));
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Login to View the Page</h2>
        <p className="text-gray-600">Please log in to access this content.</p>
      </div>
    </div>
  );
};

export default RequireLogin;
