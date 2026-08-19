'use client';

import { Disc3, Film, LogIn, LogOut, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from './LoginModal';

const NAV_LINKS = [
  { href: '/vinyls', label: 'Vinyles', Icon: Disc3 },
  { href: '/dvds', label: 'DVDs', Icon: Film },
] as const;

export default function Navbar() {
  const { isUserLoggedIn, login, logout } = useAuth();
  const pathname = usePathname();

  const [isModalOpen, setIsModalOpen] = useState(false);
  // On mémorise la page depuis laquelle le menu a été ouvert : dès qu'on
  // navigue ailleurs (lien, bouton retour du navigateur), il se referme seul.
  const [menuOpenedOn, setMenuOpenedOn] = useState<string | null>(null);
  const isMenuOpen = menuOpenedOn === pathname;

  const closeMenu = () => setMenuOpenedOn(null);

  const handleLoginSuccess = () => {
    login();
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full h-20 flex justify-between items-center gap-2 p-2 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <Link
          href="/"
          onClick={closeMenu}
          className="relative h-full aspect-square shrink-0"
        >
          <Image
            fill
            src="/neptune-collects-logo.png"
            alt="logo neptune collects"
            className="object-cover"
          />
        </Link>

        {isUserLoggedIn && (
          <div className="hidden md:flex items-center space-x-2">
            {NAV_LINKS.map(({ href, label, Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isUserLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              className="hidden md:flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              <LogOut size={18} aria-hidden="true" />
              <span>Se déconnecter</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              <LogIn size={18} aria-hidden="true" />
              <span>Se connecter</span>
            </button>
          )}

          {isUserLoggedIn && (
            <button
              type="button"
              onClick={() => setMenuOpenedOn(isMenuOpen ? null : pathname)}
              aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              className="md:hidden flex items-center justify-center h-12 w-12 rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-300"
            >
              {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          )}
        </div>
      </nav>

      {isUserLoggedIn && isMenuOpen && (
        <>
          {/* Fond cliquable pour fermer le menu */}
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={closeMenu}
            className="md:hidden fixed inset-0 top-20 z-30 bg-black/30"
          />

          <div
            id="mobile-menu"
            className="md:hidden fixed top-20 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
          >
            <div className="flex flex-col gap-2 p-3">
              {NAV_LINKS.map(({ href, label, Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 min-h-12 px-4 py-3 rounded-lg text-base font-medium transition-colors duration-300 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 min-h-12 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold transition-colors duration-300"
              >
                <LogOut size={20} aria-hidden="true" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <LoginModal
          onClose={() => setIsModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}
