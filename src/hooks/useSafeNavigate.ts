import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const useSafeNavigate = () => {
  const navigate = useNavigate();
  const { allowNavigation } = useAuth();

  return (to: string) => {
    allowNavigation();
    navigate(to, { state: { from: 'NAVIGATION' } });
  };
};