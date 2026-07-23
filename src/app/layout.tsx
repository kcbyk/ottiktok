import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Providers } from "@/components/Providers";
import { PlayerProvider } from "@/context/PlayerContext";
import MusicPlayer from "@/components/MusicPlayer";

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Savio | Müzik Platformu, Yapay Zeka Çalma Listesi ve Medya İndirici",
  description: "Savio ile yapay zeka destekli müzik listeleri oluşturun, şarkıları dinleyin ve indirin. Reklamsız TikTok, Instagram ve Pinterest medya indiricisi.",
  keywords: ["Savio", "Savio müzik", "Savio playlist", "Savio yapay zeka müzik", "yapay zeka şarkı", "ücretsiz müzik dinle", "Savio indirici", "Savio video indir", "tiktok filigransız indir"],
  authors: [{ name: "Savio" }],
  openGraph: {
    title: "Savio | Müzik Platformu ve Medya İndirici",
    description: "Savio ile yapay zeka destekli müzik listeleri oluşturun, şarkıları dinleyin ve indirin.",
    url: "https://ottiktok.vercel.app",
    siteName: "Savio",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Savio | Müzik Platformu ve Medya İndirici",
    description: "Savio ile yapay zeka destekli müzik listeleri oluşturun, şarkıları dinleyin ve indirin.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Savio",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <Providers>
          <PlayerProvider>
            {/* Global Sidebar Menü */}
            <Sidebar />
            <main className="container">
              {children}
            </main>
            <MusicPlayer />
          </PlayerProvider>
        </Providers>
      </body>
    </html>
  );
}
