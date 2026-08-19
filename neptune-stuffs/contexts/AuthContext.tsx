'use client';

import { useRouter } from 'next/navigation';
import { createContext, useState, useContext, type ReactNode } from 'react';
import { logoutAction } from '@/app/actions';

interface AuthContextType {
  isUserLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * `initialLoggedIn` vient du serveur (cookie de session lu dans le layout) :
 * c'est ce qui permet de rester connecté après un rechargement de page.
 */
export function AuthProvider({
  children,
  initialLoggedIn = false,
}: {
  children: ReactNode;
  initialLoggedIn?: boolean;
}) {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(initialLoggedIn);
  const router = useRouter();

  const login = () => {
    setIsUserLoggedIn(true);
    // Resynchronise les composants serveur, qui ont été rendus avant le cookie.
    router.refresh();
  };

  const logout = () => {
    setIsUserLoggedIn(false);
    void logoutAction().then(() => {
      router.refresh();
    });
  };

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
