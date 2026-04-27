import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Mythara — Gardiens des Élements",
  description:
    "Collectionne, ouvre des coffres, échange et combats en ligne avec tes Mythariens.",
  openGraph: {
    title: "Mythara",
    description: "Le jeu de collection multijoueur en ligne.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased font-sans">
        {children}
        <Toaster
          theme="dark"
          richColors
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(20,20,30,0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              backdropFilter: "blur(8px)"
            }
          }}
        />
      </body>
    </html>
  );
}
