'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; 

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isUserLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoggedIn) {
      router.push('/');
    }
  }, [isUserLoggedIn, router]);

  if (isUserLoggedIn) {
    return <>{children}</>;
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-lg">Vérification de l'accès...</p>
    </div>
  );
}
