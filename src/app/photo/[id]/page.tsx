"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

function PhotoContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const imgUrl = searchParams.get("url") || "";
  const filename = searchParams.get("fn") || "photo.jpg";
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    if (!imgUrl) return;
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const ext = blob.type.includes("png") ? ".png" : ".jpg";
      const name = filename.includes(".") ? filename : filename + ext;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      // Fallback
      const a = document.createElement("a");
      a.href = imgUrl;
      a.download = filename;
      a.target = "_blank";
      a.click();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const bg: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    gap: "1.25rem",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "white",
  };

  if (!imgUrl) {
    return (
      <div style={bg}>
        <p style={{ opacity: 0.5 }}>Fotoğraf bulunamadı.</p>
      </div>
    );
  }

  return (
    <div style={bg}>
      {/* Fotoğraf */}
      <div style={{
        maxWidth: "min(92vw, 600px)", width: "100%",
        borderRadius: "16px", overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <img
          src={imgUrl}
          alt={filename}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>

      {/* Dosya adı */}
      <p style={{ fontSize: "0.82rem", opacity: 0.45 }}>{decodeURIComponent(filename)}</p>

      {/* Butonlar */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: "400px" }}>
        <button onClick={handleDownload} style={{
          flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          padding: "0.85rem 1.5rem", borderRadius: "10px", border: "none",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white", fontWeight: 700, fontSize: "1rem", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          İndir
        </button>

        <button onClick={handleCopy} style={{
          flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          padding: "0.85rem 1.25rem", borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.15)",
          background: copied ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.07)",
          color: copied ? "#4ade80" : "white",
          fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
          transition: "all 0.2s ease",
        }}>
          {copied ? "✓ Kopyalandı" : "Linki Kopyala"}
        </button>
      </div>

      <p style={{ fontSize: "0.72rem", opacity: 0.3, textAlign: "center" }}>
        Bu link herkesle paylaşılabilir
      </p>
    </div>
  );
}

export default function PhotoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.15)", borderTop: "3px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <PhotoContent />
    </Suspense>
  );
}
