"use client";

import { useState, useRef } from "react";
import Link from "next/link";

function isUrl(text: string) {
  return /^https?:\/\//i.test(text) || /^www\./i.test(text);
}

export default function QRReaderPage() {
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePrev, setImagePrev] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const readQR = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seçin.");
      return;
    }
    setLoading(true);
    setResult("");
    setError("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImagePrev(dataUrl);
      try {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const jsQR = (await import("jsqr")).default;
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code) {
            setResult(code.data);
          } else {
            const code2 = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "onlyInvert",
            });
            if (code2) {
              setResult(code2.data);
            } else {
              setError("QR kod bulunamadı. Görsel net ve tam olduğundan emin olun.");
            }
          }
          setLoading(false);
        };
        img.onerror = () => { setError("Görsel yüklenemedi."); setLoading(false); };
        img.src = dataUrl;
      } catch (err: any) {
        setError("Okuma hatası: " + err.message);
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readQR(file);
  };

  const handleCopy = () => { navigator.clipboard.writeText(result).catch(() => {}); };

  const handleOpen = () => {
    const url = result.startsWith("http") ? result : "https://" + result;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const spin = { animation: "spin 1s linear infinite" } as React.CSSProperties;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", alignItems: "center", maxWidth: "600px", margin: "0 auto" }}>

      <div style={{ width: "100%", marginTop: "0.5rem" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.9rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Ana Sayfaya Dön
        </Link>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ width: "70px", height: "70px", borderRadius: "18px", background: "linear-gradient(135deg, #10b981, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", boxShadow: "0 8px 30px rgba(16,185,129,0.35)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, background: "linear-gradient(135deg, #10b981, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.5rem" }}>
          QR Okuyucu
        </h1>
        <p className="subtitle" style={{ margin: 0 }}>QR kod görselini yükle — içeriği anında oku ve aç.</p>
      </div>

      <div className="glass-panel" style={{ width: "100%", padding: "1.5rem" }}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: isDragging ? "2px dashed #10b981" : "2px dashed rgba(255,255,255,0.15)",
            borderRadius: "12px", padding: "2rem", textAlign: "center", cursor: "pointer",
            background: isDragging ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.02)",
            transition: "all 0.2s ease",
          }}
        >
          {imagePrev ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <img src={imagePrev} alt="QR" style={{ maxHeight: "180px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain" }} />
              <p style={{ fontSize: "0.82rem", opacity: 0.6 }}>Farklı QR okutmak için tıkla</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", opacity: 0.5 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <path d="M14 14h2v2h-2z"/><path d="M18 14h3v2h-3z"/>
              </svg>
              <p style={{ fontSize: "0.9rem" }}>QR kod görselini sürükle veya tıkla</p>
              <p style={{ fontSize: "0.75rem" }}>JPG, PNG, WebP desteklenir</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) readQR(f); }} />
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", opacity: 0.7 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={spin}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <span style={{ fontSize: "0.88rem" }}>QR okunuyor...</span>
        </div>
      )}

      {error && (
        <div className="glass-panel" style={{ width: "100%", border: "1px solid #ef4444", background: "rgba(239,68,68,0.08)", padding: "1rem 1.5rem" }}>
          <p style={{ color: "#ef4444", textAlign: "center", fontWeight: 600, fontSize: "0.9rem" }}>{error}</p>
        </div>
      )}

      {result && (
        <div className="glass-panel" style={{ width: "100%", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>QR Okundu</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "1rem", border: "1px solid rgba(255,255,255,0.08)", wordBreak: "break-all" }}>
            <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: isUrl(result) ? "#10b981" : "rgba(255,255,255,0.9)" }}>{result}</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {isUrl(result) && (
              <button onClick={handleOpen} className="btn" style={{ flex: 1, background: "linear-gradient(135deg, #10b981, #0ea5e9)", fontSize: "0.88rem", padding: "0.7rem", minWidth: "120px" }}>
                Sayfayı Aç
              </button>
            )}
            <button onClick={handleCopy} className="btn btn-secondary" style={{ flex: 1, fontSize: "0.88rem", padding: "0.7rem", minWidth: "120px" }}>
              Kopyala
            </button>
            <button onClick={() => { setResult(""); setError(""); setImagePrev(""); }} className="btn btn-secondary" style={{ flex: "0 0 auto", fontSize: "0.88rem", padding: "0.7rem 1rem" }}>
              Temizle
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
