import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SSSTik Clone - Ad-Free TikTok Downloader",
  description: "Download TikTok videos without watermark for free, without any ads. Modern and fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
