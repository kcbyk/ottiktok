"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function getFileIcon(mimeType: string, filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf') || ext === 'pdf') return '📄';
  if (mimeType.includes('word') || ext === 'docx' || ext === 'doc') return '📝';
  if (mimeType.includes('excel') || ext === 'xlsx' || ext === 'xls') return '📊';
  if (mimeType.includes('zip') || mimeType.includes('rar') || ['zip','rar','7z'].includes(ext)) return '🗜️';
  if (mimeType.includes('text') || ext === 'txt') return '📃';
  if (mimeType.startsWith('image/')) return '🖼️';
  return '📁';
}

function FileContent() {
  const searchParams = useSearchParams();
  const fileUrl  = decodeURIComponent(searchParams.get("url")  || "");
  const filename = decodeURIComponent(searchParams.get("fn")   || "dosya");
  const mimeType = decodeURIComponent(searchParams.get("type") || "");

  const [copied,      setCopied]      = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dlError,     setDlError]     = useState("");

  const icon     = getFileIcon(mimeType, filename);
  const isAudio  = mimeType.startsWith('audio/');
  const isVideo  = mimeType.startsWith('video/');
  const isImage  = mimeType.startsWith('image/');

  /* ── İndirme: blob fetch → tarayıcıya ver ── */
  const handleDownload = async () => {
    if (!fileUrl) return;
    setDownloading(true);
    setDlError("");
    try {
      const res = await fetch(fileUrl, { mode: 'cors' });
      if (!res.ok) throw new Error(`Sunucu hatası: ${res.status}`);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objUrl), 10000);
    } catch (err: any) {
      // CORS veya başka sorun → /api/force-download proxy dene
      try {
        const proxyUrl = `/api/force-download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`;
        const res2 = await fetch(proxyUrl);
        if (!res2.ok) throw new Error(`Proxy hatası: ${res2.status}`);
        const blob2 = await res2.blob();
        const objUrl2 = URL.createObjectURL(blob2);
        const a2 = document.createElement("a");
        a2.href = objUrl2;
        a2.download = filename;
        document.body.appendChild(a2);
        a2.click();
        document.body.removeChild(a2);
        setTimeout(() => URL.revokeObjectURL(objUrl2), 10000);
      } catch (err2: any) {
        setDlError("İndirme başarısız: " + err2.message);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const spin = { animation: "spin 1s linear infinite" } as React.CSSProperties;

  if (!fileUrl) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        <p style={{ opacity: 0.5 }}>Dosya bulunamadı.</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "2rem", gap: "1.5rem",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "white",
    }}>
      {/* ── Dosya kartı ── */}
      <div style={{
        width: "min(92vw, 460px)", padding: "2rem 1.75rem",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px", textAlign: "center",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
      }}>
        {/* Ses oynatıcı */}
        {isAudio && (
          <audio controls src={fileUrl} style={{ width: "100%" }}>
            Tarayıcınız ses oynatmayı desteklemiyor.
          </audio>
        )}
        {/* Video oynatıcı */}
        {isVideo && (
          <video controls src={fileUrl} style={{ width: "100%", borderRadius: "8px", maxHeight: "300px" }}>
            Tarayıcınız video oynatmayı desteklemiyor.
          </video>
        )}
        {/* Görsel önizleme */}
        {isImage && (
          <img
            src={fileUrl}
            alt={filename}
            style={{ maxWidth: "100%", maxHeight: "280px", borderRadius: "8px", objectFit: "contain" }}
          />
        )}
        {/* Diğerleri için büyük ikon */}
        {!isAudio && !isVideo && !isImage && (
          <div style={{ fontSize: "4rem", lineHeight: 1 }}>{icon}</div>
        )}

        <div>
          <p style={{ fontWeight: 700, fontSize: "1.05rem", wordBreak: "break-all" }}>{filename}</p>
          {mimeType && <p style={{ fontSize: "0.78rem", opacity: 0.4, marginTop: "0.25rem" }}>{mimeType}</p>}
        </div>
      </div>

      {/* ── Hata mesajı ── */}
      {dlError && (
        <div style={{ width: "min(92vw, 460px)", padding: "0.75rem 1rem", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444" }}>
          <p style={{ color: "#ef4444", fontSize: "0.85rem", textAlign: "center" }}>{dlError}</p>
        </div>
      )}

      {/* ── Butonlar ── */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", width: "min(92vw, 460px)" }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            flex: 1, minWidth: "160px",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            padding: "0.9rem 1.5rem", borderRadius: "10px", border: "none",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white", fontWeight: 700, fontSize: "1rem",
            cursor: downloading ? "wait" : "pointer",
            boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            opacity: downloading ? 0.7 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {downloading ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={spin}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              İndiriliyor...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              İndir
            </>
          )}
        </button>

        <button
          onClick={handleCopy}
          style={{
            flex: 1, minWidth: "140px",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            padding: "0.9rem 1.25rem", borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: copied ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.07)",
            color: copied ? "#4ade80" : "white",
            fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {copied ? "✓ Kopyalandı" : "Linki Kopyala"}
        </button>
      </div>

      <p style={{ fontSize: "0.72rem", opacity: 0.25, textAlign: "center" }}>
        QR Kod ile paylaşıldı
      </p>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function FilePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.15)", borderTop: "3px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <FileContent />
    </Suspense>
  );
}
