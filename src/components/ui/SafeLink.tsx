import { Link, LinkProps } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const SafeLink = ({ children, to, ...props }: LinkProps) => {
  const { allowNavigation } = useAuth();

  return (
    <Link
      to={to}
      {...props}
      state={{ from: 'NAVIGATION' }}
      onClick={allowNavigation}
    >
      {children}
    </Link>
  );
};