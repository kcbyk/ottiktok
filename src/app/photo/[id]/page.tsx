"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PhotoContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {}).catch(() => {});
  };

  if (!url) {
    return (
      <div style={{ textAlign: "center", opacity: 0.5, paddingTop: "4rem" }}>
        <p>Fotoğraf bulunamadı.</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      gap: "1.5rem",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Fotoğraf */}
      <div style={{
        maxWidth: "min(90vw, 600px)",
        width: "100%",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <img src={url} alt="Fotoğraf" style={{ width: "100%", height: "auto", display: "block" }} />
      </div>

      {/* Butonlar */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.8rem 1.75rem", borderRadius: "10px", border: "none",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white", fontWeight: 700, fontSize: "1rem",
            cursor: "pointer", textDecoration: "none",
            boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          İndir
        </a>

        <button
          onClick={handleCopy}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.8rem 1.5rem", borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.07)",
            color: "white", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Linki Kopyala
        </button>
      </div>

      <p style={{ fontSize: "0.78rem", opacity: 0.35, textAlign: "center", color: "white" }}>
        QR Kod ile paylaşıldı
      </p>
    </div>
  );
}

export default function PhotoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "white", opacity: 0.5 }}>Yükleniyor...</p>
      </div>
    }>
      <PhotoContent />
    </Suspense>
  );
}
