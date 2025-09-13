'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextType {
  isUserLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  const login = () => setIsUserLoggedIn(true);
  const logout = () => setIsUserLoggedIn(false);

  return (
    <AuthContext.Provider value={{ isUserLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}