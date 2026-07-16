"use client";

import { useState, useRef } from "react";
import Link from "next/link";

function isUrl(text: string) {
  return /^https?:\/\//i.test(text) || /^www\./i.test(text);
}

// URL'den dosya adını çıkar
function getFilenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    // ?fn= parametresi varsa onu kullan (bizim share link formatımız)
    const fn = u.searchParams.get("fn");
    if (fn) return decodeURIComponent(fn);
    // Yoksa path'in son parçasını al
    const parts = u.pathname.split("/");
    const last = parts[parts.length - 1];
    if (last && last.includes(".")) return decodeURIComponent(last);
    return "dosya";
  } catch {
    return "dosya";
  }
}

// URL'den MIME type çıkar
function getMimeFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const type = u.searchParams.get("type");
    if (type) return decodeURIComponent(type);
  } catch {}
  return "";
}

function getFileIcon(mimeType: string, filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf') || ext === 'pdf') return '📄';
  if (mimeType.includes('word') || ['docx','doc'].includes(ext)) return '📝';
  if (mimeType.includes('excel') || ['xlsx','xls'].includes(ext)) return '📊';
  if (['zip','rar','7z'].includes(ext)) return '🗜️';
  if (mimeType.includes('text') || ext === 'txt') return '📃';
  if (mimeType.startsWith('image/')) return '🖼️';
  return '📁';
}

// Bizim /file/[id] share link'i mi?
function isShareLink(url: string): boolean {
  try {
    const u = new URL(url);
    return u.pathname.startsWith('/file/') && u.searchParams.has('url');
  } catch {
    return false;
  }
}

export default function QRReaderPage() {
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
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

    reader.onerror = () => {
      setError("Dosya okunamadı.");
      setLoading(false);
    };

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePrev(dataUrl);

      const img = new Image();

      img.onerror = () => {
        setError("Görsel yüklenemedi.");
        setLoading(false);
      };

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          // Büyük görselleri scale down et — QR okuma için yeterli
          const maxDim = 1600;
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
            else { w = Math.round(w * maxDim / h); h = maxDim; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { setError("Canvas hatası."); setLoading(false); return; }
          ctx.drawImage(img, 0, 0, w, h);

          // Önce jsqr dene (hızlı)
          import("jsqr").then(({ default: jsQR }) => {
            const imageData = ctx.getImageData(0, 0, w, h);
            // Her iki renk kombinasyonunu dene
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" })
              || jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "onlyInvert" });

            if (code?.data) {
              setResult(code.data);
              setLoading(false);
              return;
            }

            // jsqr bulamazsa zxing ile dene (daha güçlü)
            import("@zxing/browser").then(({ BrowserMultiFormatReader }) => {
              const zxing = new BrowserMultiFormatReader();
              const imgEl = document.createElement("img");
              imgEl.src = canvas.toDataURL("image/png");
              imgEl.onload = async () => {
                try {
                  const result = await zxing.decodeFromImageElement(imgEl);
                  if (result?.getText()) {
                    setResult(result.getText());
                  } else {
                    setError("QR kod bulunamadı. Görselin net ve tam olduğundan emin olun.");
                  }
                } catch {
                  setError("QR kod bulunamadı. Görselin net ve tam olduğundan emin olun.");
                } finally {
                  setLoading(false);
                }
              };
              imgEl.onerror = () => {
                setError("QR kod okunamadı.");
                setLoading(false);
              };
            }).catch(() => {
              setError("QR kod bulunamadı.");
              setLoading(false);
            });
          }).catch(err => {
            setError("Kütüphane yüklenemedi: " + err.message);
            setLoading(false);
          });
        } catch (err: any) {
          setError("İşlem hatası: " + err.message);
          setLoading(false);
        }
      };

      img.src = dataUrl;
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

  // QR'dan gelen dosyayı indir — /api/force-download proxy üzerinden
  const handleDownload = () => {
    if (!result) return;
    setDownloading(true);

    try {
      let fileUrl = result;
      let filename = "dosya";

      // Bizim share link formatımızsa direkt URL ve dosya adını çıkar
      if (isShareLink(result)) {
        const u = new URL(result);
        const rawUrl = u.searchParams.get("url");
        if (rawUrl) fileUrl = decodeURIComponent(rawUrl);
        filename = getFilenameFromUrl(result);
      } else {
        filename = getFilenameFromUrl(result);
      }

      const proxyUrl = `/api/force-download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`;
      const a = document.createElement("a");
      a.href = proxyUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  };

  const spin = { animation: "spin 1s linear infinite" } as React.CSSProperties;

  // QR sonucu için dosya bilgileri
  const filename = result ? getFilenameFromUrl(result) : "";
  const mimeType = result ? getMimeFromUrl(result) : "";
  const fileIcon = filename ? getFileIcon(mimeType, filename) : "📁";
  const isFile = isShareLink(result);
  const isAnyUrl = isUrl(result);

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
        <p className="subtitle" style={{ margin: 0 }}>QR kod görselini yükle — dosyayı anında indir veya linki aç.</p>
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

          {/* Dosya share link ise dosya kartı göster */}
          {isFile && (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "0.85rem 1rem", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: "2rem", lineHeight: 1 }}>{fileIcon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", wordBreak: "break-all" }}>{filename}</p>
                {mimeType && <p style={{ fontSize: "0.72rem", opacity: 0.45, marginTop: "2px" }}>{mimeType}</p>}
              </div>
            </div>
          )}

          {/* URL metni */}
          {!isFile && (
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "1rem", border: "1px solid rgba(255,255,255,0.08)", wordBreak: "break-all" }}>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: isAnyUrl ? "#10b981" : "rgba(255,255,255,0.9)" }}>{result}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Dosya share link ise büyük İndir + Sayfada Aç butonları */}
            {isFile && (
              <>
                <button
                  onClick={() => window.open(result, '_blank', 'noopener,noreferrer')}
                  className="btn"
                  style={{ flex: 1, background: "linear-gradient(135deg, #10b981, #0ea5e9)", fontSize: "0.88rem", padding: "0.7rem", minWidth: "120px" }}
                >
                  Sayfada Aç
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: "0.88rem", padding: "0.7rem", minWidth: "100px", opacity: downloading ? 0.7 : 1 }}
                >
                  {downloading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "center" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={spin}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      İndiriliyor...
                    </span>
                  ) : "⬇ İndir"}
                </button>
              </>
            )}

            {/* Normal URL ise Sayfayı Aç + Dosyayı İndir butonları */}
            {!isFile && isAnyUrl && (
              <>
                <button onClick={handleOpen} className="btn" style={{ flex: 1, background: "linear-gradient(135deg, #10b981, #0ea5e9)", fontSize: "0.88rem", padding: "0.7rem", minWidth: "120px" }}>
                  Sayfayı Aç
                </button>
                <button onClick={handleDownload} disabled={downloading} className="btn btn-secondary" style={{ flex: 1, fontSize: "0.88rem", padding: "0.7rem", minWidth: "120px", opacity: downloading ? 0.7 : 1 }}>
                  {downloading ? "İndiriliyor..." : "⬇ İndir"}
                </button>
              </>
            )}

            <button onClick={handleCopy} className="btn btn-secondary" style={{ flex: 1, fontSize: "0.88rem", padding: "0.7rem", minWidth: "100px" }}>
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
