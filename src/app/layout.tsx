import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "SSSTik Clone - Ad-Free TikTok, Instagram & Pinterest Downloader",
  description: "Download TikTok, Instagram, and Pinterest media without watermark for free, without any ads. Modern and fast.",
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
