'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LoginModal from './LoginModal';
import { useAuth } from '@/contexts/AuthContext'; 

export default function Navbar() {
  const { isUserLoggedIn, login, logout } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLoginSuccess = () => {
    login(); 
    setIsModalOpen(false); 
  };

  return (
    <>
      <nav className="w-full h-20 flex justify-between items-center p-2 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <Link href="/" className='relative h-full aspect-square'>
            <Image
                fill
                src="/neptune-collects-logo.png"
                alt='logo neptune collects'
                className='object-cover'
            />
        </Link>

        {isUserLoggedIn && (
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/vinyls" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors duration-300">
              <span>Vinyles</span>
            </Link>
            <Link href="/dvd" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors duration-300">
              <span>DVD</span>
            </Link>
          </div>
        )}

        <div className="flex items-center">
           {isUserLoggedIn ? (
            <button type='button'
              onClick={logout} 
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              <span>Se déconnecter</span>
            </button>
          ) : (
            <button
            type='button'
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              <span>Se connecter</span>
            </button>
          )}
        </div>
      </nav>

      {isModalOpen && (
        <LoginModal
          onClose={() => setIsModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}
