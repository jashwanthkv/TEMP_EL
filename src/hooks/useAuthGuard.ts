import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuthGuard = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!localStorage.getItem('userEmail')) {
      navigate('/');
    }
  }, [navigate]);
  
  return !!localStorage.getItem('userEmail');
};
