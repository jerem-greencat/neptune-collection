import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import { isSessionValid } from "@/lib/session";

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
    <html lang="fr">
      <head />
      <body>
        <AuthProvider initialLoggedIn={isLoggedIn}>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
