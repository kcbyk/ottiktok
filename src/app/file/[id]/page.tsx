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
  return '📁';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function FileContent() {
  const searchParams = useSearchParams();
  const fileUrl = decodeURIComponent(searchParams.get("url") || "");
  const filename = decodeURIComponent(searchParams.get("fn") || "file");
  const mimeType = decodeURIComponent(searchParams.get("type") || "");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const icon = getFileIcon(mimeType, filename);
  const isAudio = mimeType.startsWith('audio/');
  const isVideo = mimeType.startsWith('video/');

  const handleDownload = async () => {
    if (!fileUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = filename;
      a.target = "_blank";
      a.click();
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
      {/* Dosya kartı */}
      <div style={{
        width: "min(90vw, 400px)", padding: "2.5rem 2rem",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px", textAlign: "center",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
      }}>
        {/* Ses oynatıcı */}
        {isAudio && (
          <audio controls src={fileUrl} style={{ width: "100%", marginBottom: "0.5rem" }}>
            Tarayıcınız ses oynatmayı desteklemiyor.
          </audio>
        )}
        {/* Video oynatıcı */}
        {isVideo && (
          <video controls src={fileUrl} style={{ width: "100%", borderRadius: "8px", maxHeight: "300px" }}>
            Tarayıcınız video oynatmayı desteklemiyor.
          </video>
        )}
        {/* Diğer dosyalar için ikon */}
        {!isAudio && !isVideo && <div style={{ fontSize: "4rem", lineHeight: 1 }}>{icon}</div>}
        <div>
          <p style={{ fontWeight: 700, fontSize: "1.05rem", wordBreak: "break-all" }}>{filename}</p>
          {mimeType && <p style={{ fontSize: "0.78rem", opacity: 0.4, marginTop: "0.25rem" }}>{mimeType}</p>}
        </div>
      </div>

      {/* Butonlar */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", width: "min(90vw, 400px)" }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            padding: "0.9rem 1.5rem", borderRadius: "10px", border: "none",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white", fontWeight: 700, fontSize: "1rem",
            cursor: downloading ? "wait" : "pointer",
            boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            opacity: downloading ? 0.7 : 1,
          }}
        >
          {downloading ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          )}
          {downloading ? "İndiriliyor..." : "İndir"}
        </button>

        <button
          onClick={handleCopy}
          style={{
            flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
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
