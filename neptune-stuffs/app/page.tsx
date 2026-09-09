"use client";

import { Disc3, Film } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useState } from "react";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Les deux collections, présentées comme deux rayons.
 *
 * La vignette n'est pas décorative : un carré avec un disque au centre, un
 * rectangle avec une tranche sur le côté. On reconnaît l'objet avant de lire
 * l'étiquette.
 */
const SHELVES = [
  {
    href: "/vinyls",
    label: "Vinyles",
    detail: "Albums, pressages, rééditions",
    Icon: Disc3,
    accent: "text-groove-400",
    border: "hover:border-groove-500/60",
    glow: "group-hover:bg-groove-500/10",
  },
  {
    href: "/dvds",
    label: "Films & séries",
    detail: "Films, séries, saisons, documentaires",
    Icon: Film,
    accent: "text-reel-400",
    border: "hover:border-reel-500/60",
    glow: "group-hover:bg-reel-500/10",
  },
] as const;

export default function Home() {
  const { isUserLoggedIn, login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const router = useRouter();

  const handleProtectedClick = (
    event: MouseEvent<HTMLAnchorElement>,
    path: string,
  ) => {
    if (!isUserLoggedIn) {
      event.preventDefault();
      setRedirectPath(path);
      setShowLoginModal(true);
    }
  };

  const handleLoginSuccess = () => {
    login();
    setShowLoginModal(false);

    if (redirectPath) {
      router.push(redirectPath);
      setRedirectPath(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-5 py-16 sm:px-8">
      <p className="label-caps">Collection personnelle</p>

      <h1 className="mt-4 font-display text-5xl leading-[1.05] text-paper-50 sm:text-7xl">
        Neptune Collects
      </h1>

      <p className="mt-5 max-w-md text-base leading-relaxed text-paper-400">
        Vos vinyles et vos films au même endroit. Scannez, retrouvez, et sachez
        toujours ce que vous possédez déjà.
      </p>

      <div className="mt-12 grid gap-3 sm:grid-cols-2">
        {SHELVES.map(({ href, label, detail, Icon, accent, border, glow }) => (
          <Link
            key={href}
            href={href}
            onClick={(event) => handleProtectedClick(event, href)}
            className={`group relative overflow-hidden rounded-lg border border-ink-800 bg-ink-900/60 p-5 transition-colors ${border}`}
          >
            {/* Lueur d'accent au survol, du coin haut-droit. */}
            <span
              className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-transparent blur-2xl transition-colors ${glow}`}
            />

            <Icon
              size={26}
              strokeWidth={1.5}
              aria-hidden="true"
              className={accent}
            />

            <p className="mt-6 font-display text-2xl text-paper-50">{label}</p>
            <p className="mt-1 text-sm text-paper-500">{detail}</p>
          </Link>
        ))}
      </div>

      <p className="mt-16 catalog-num text-xs text-paper-600">
        © {new Date().getFullYear()} Neptune Collects
      </p>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
