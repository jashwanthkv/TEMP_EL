// src/context/AuthContext.tsx
import { createContext, useContext, ReactNode, useState } from 'react';

interface AuthContextType {
  isAuthenticated: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: () => false,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  const isAuthenticated = () => {
    const userEmail = localStorage.getItem('userEmail');
    console.log('isAuthenticated check - userEmail:', userEmail);
    console.log('isAuthenticated result:', !!userEmail);
    return !!userEmail;
  };

  const login = async (email: string, password: string) => {
    // Your login logic here
    const role = 'admin'; // Replace with actual role from your auth system
    setUser({ email, role });
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', role);
  };

  const logout = () => {
    console.log('AuthContext logout called...');
    setUser(null);
    localStorage.clear();
    console.log('localStorage cleared in AuthContext');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);