'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { useState, MouseEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/LoginModal';

export default function Home() {
  const { isUserLoggedIn, login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const router = useRouter();

  const handleProtectedClick = (e: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!isUserLoggedIn) {
      e.preventDefault();
      setRedirectPath(path);
      setShowLoginModal(true);
    }
  };

  const handleLoginSuccess = () => {
    login();
    setShowLoginModal(false);
    if (redirectPath) {
      router.push(redirectPath);
      setRedirectPath(null); // Reset after redirecting
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 dark:bg-gray-900">

      <main className="flex flex-col items-center text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500 sm:text-7xl">
          Neptune Collects
        </h1>

        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
          Votre collection de vinyles et DVDs, au même endroit.
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">

          <Link
            href="/vinyls"
            onClick={(e) => handleProtectedClick(e, '/vinyls')}
            className="flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-md transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="mr-2">💿</span>
            Gérer mes Vinyles
          </Link>

          <Link
            href="/dvds"
            onClick={(e) => handleProtectedClick(e, '/dvds')}
            className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <span className="mr-2">🎬</span>
            Gérer mes DVDs
          </Link>

        </div>
      </main>

      <footer className="absolute bottom-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Neptune Collects.
        </p>
      </footer>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}