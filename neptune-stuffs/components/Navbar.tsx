'use client'; 

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  return (
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
            <a href="/vinyls" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-300">
              {/* <Disc className="h-5 w-5" /> */}
              <span>Vinyles</span>
            </a>
            <a href="/dvd" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-300">
              {/* <Film className="h-5 w-5" /> */}
              <span>DVD</span>
            </a>
          </div>
        )}

<div className="flex items-center">
           {isUserLoggedIn ? (
            // Bouton visible lorsque l'utilisateur est connecté
            <button type='button'
              onClick={() => setIsUserLoggedIn(false)}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              {/* <LogOut className="h-5 w-5" /> */}
              <span>Se déconnecter</span>
            </button>
          ) : (
            // Bouton visible lorsque l'utilisateur n'est pas connecté
            <button
            type='button'
              onClick={() => setIsUserLoggedIn(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              {/* <LogIn className="h-5 w-5" /> */}
              <span>Se connecter</span>
            </button>
          )}
        </div>

    </nav>
  );
}