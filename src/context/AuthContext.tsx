import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  token: string | null;
  userRole: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken]         = useState<string | null>(null);
  const [userRole, setUserRole]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // بيلود الـ token من AsyncStorage لما التطبيق يفتح
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedRole  = await AsyncStorage.getItem('userRole');
        if (savedToken) setToken(savedToken);
        if (savedRole)  setUserRole(savedRole);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  // نفس لوجيك الرياكت بالظبط — بس AsyncStorage بدل localStorage
  const login = async (newToken: string, role: string) => {
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('userRole', role);
    setToken(newToken);
    setUserRole(role);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userRole');
    setToken(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{
      token, userRole, isAuthenticated: !!token, isLoading, login, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};