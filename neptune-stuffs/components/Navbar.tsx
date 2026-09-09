"use client";

import { Disc3, Film, LogIn, LogOut, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PRIMARY_BUTTON_CLASS } from "@/components/ui/styles";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "./LoginModal";

const NAV_LINKS = [
  { href: "/vinyls", label: "Vinyles", Icon: Disc3 },
  { href: "/dvds", label: "DVDs", Icon: Film },
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
      <nav className="sticky top-0 z-40 flex h-16 w-full items-center justify-between gap-2 border-b border-ink-800 bg-ink-950/85 px-3 backdrop-blur-md sm:px-5">
        <Link
          href="/"
          onClick={closeMenu}
          className="flex shrink-0 items-center gap-2.5"
        >
          <Image
            width={36}
            height={36}
            src="/neptune-mark.png"
            alt="Neptune Collects"
            className="h-8 w-8 object-contain"
          />
          <span className="hidden font-display text-xl leading-none text-paper-50 sm:block">
            Neptune Collects
          </span>
        </Link>

        {isUserLoggedIn && (
          <div className="hidden md:flex items-center space-x-2">
            {NAV_LINKS.map(({ href, label, Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-groove-400 text-paper-50"
                      : "border-transparent text-paper-500 hover:text-paper-200"
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
              className="hidden items-center gap-2 text-sm font-medium text-paper-500 transition-colors hover:text-alert-400 md:flex"
            >
              <LogOut size={18} aria-hidden="true" />
              <span>Se déconnecter</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={PRIMARY_BUTTON_CLASS}
            >
              <LogIn size={18} aria-hidden="true" />
              <span>Se connecter</span>
            </button>
          )}

          {isUserLoggedIn && (
            <button
              type="button"
              onClick={() => setMenuOpenedOn(isMenuOpen ? null : pathname)}
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              className="flex h-11 w-11 items-center justify-center rounded-md text-paper-200 transition-colors hover:bg-ink-850 md:hidden"
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
            className="fixed inset-0 top-16 z-30 bg-ink-950/70 backdrop-blur-sm md:hidden"
          />

          <div
            id="mobile-menu"
            className="fixed inset-x-0 top-16 z-40 border-b border-ink-800 bg-ink-900 md:hidden"
          >
            <div className="flex flex-col gap-2 p-3">
              {NAV_LINKS.map(({ href, label, Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-md px-4 py-3 text-base font-medium transition-colors ${
                      isActive
                        ? "bg-ink-850 text-groove-300"
                        : "text-paper-200 hover:bg-ink-850"
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
                className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-ink-700 px-4 py-3 font-medium text-alert-400 transition-colors hover:bg-ink-850"
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
