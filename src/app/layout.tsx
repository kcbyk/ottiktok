import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Savio - Ad-Free Social Media Downloader",
  description: "Download TikTok, Instagram, and Pinterest media without watermark for free, without any ads. Modern and fast.",
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
        {/* Global Sidebar Menü */}
        <Sidebar />
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
