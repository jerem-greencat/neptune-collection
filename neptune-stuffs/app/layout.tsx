import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";



export const metadata: Metadata = {
  title: "Neptune Collects",
  description: "Gère ta collection partout, tout le temps",
};



export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="fr">
      <head />
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
