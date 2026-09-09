import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import { isSessionValid } from "@/lib/session";

/** Texte courant et interface. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Titres. Une serif à fort contraste donne le ton éditorial d'un catalogue ou
 * d'un générique, là où une grotesque neutre ferait « tableau de bord ».
 */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Neptune Collects",
  description: "Gère ta collection partout, tout le temps",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoggedIn = await isSessionValid();

  return (
    <html lang="fr" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body>
        <AuthProvider initialLoggedIn={isLoggedIn}>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
