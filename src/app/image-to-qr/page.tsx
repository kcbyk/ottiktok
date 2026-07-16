"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

function getFileIcon(mimeType: string, filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (mimeType.startsWith('image/')) return null; // Görsel — önizleme göster
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf') || ext === 'pdf') return '📄';
  if (mimeType.includes('word') || ['docx','doc'].includes(ext)) return '📝';
  if (mimeType.includes('excel') || ['xlsx','xls'].includes(ext)) return '📊';
  if (['zip','rar','7z'].includes(ext)) return '🗜️';
  if (mimeType.includes('text') || ext === 'txt') return '📃';
  return '📁';
}

export default function FileToQRPage() {
  const [preview, setPreview] = useState<string | null>(null); // görsel önizleme
  const [fileIcon, setFileIcon] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileMime, setFileMime] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [qrSize, setQrSize] = useState(400);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("H");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateQRFromUrl = useCallback(async (url: string) => {
    if (!url) return;
    setGenerating(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const qr = await QRCode.toDataURL(url, {
        width: qrSize, margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      });
      setQrDataUrl(qr);
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  }, [qrSize, fgColor, bgColor, errorLevel]);

  useEffect(() => {
    if (!uploadedUrl) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => generateQRFromUrl(uploadedUrl), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [uploadedUrl, generateQRFromUrl]);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setFileMime(file.type);
    setQrDataUrl(""); setUploadedUrl(""); setUploadError("");
    setPreview(null); setFileIcon(null);

    const icon = getFileIcon(file.type, file.name);
    if (icon) setFileIcon(icon);

    const isImage = file.type.startsWith("image/");

    // Görsel için önizleme oluştur
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1200;
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
            else { w = Math.round(w * maxDim / h); h = maxDim; }
          }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, w, h);
          setPreview(canvas.toDataURL("image/jpeg", 0.92));
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }

    // Cloudinary'e direkt yükle (client-side) — Vercel body limitini aşmaz
    setUploading(true);
    try {
      // 1. Server'dan imza al
      const signRes = await fetch('/api/cloudinary-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mimeType: file.type, filename: file.name }),
      });
      const { signature, timestamp, folder, cloud, apiKey } = await signRes.json();

      // 2. Dosyayı direkt Cloudinary'ye gönder
      // 10MB üzeri dosyalar için chunked upload gerekli
      const isAudio = file.type.startsWith('audio/');
      const isVideo = file.type.startsWith('video/');
      let resourceType = 'image';
      if (isAudio || (!isImage && !isVideo)) resourceType = 'raw';
      else if (isVideo) resourceType = 'video';

      const CHUNK_SIZE = 9 * 1024 * 1024; // 9MB chunk
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/upload`;

      let data: any;

      if (file.size <= CHUNK_SIZE) {
        // Küçük dosya — direkt upload
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', apiKey);
        form.append('timestamp', timestamp);
        form.append('signature', signature);
        form.append('folder', folder);
        const uploadRes = await fetch(uploadUrl, { method: 'POST', body: form });
        data = await uploadRes.json();
      } else {
        // Büyük dosya — chunked upload
        const uniqueUploadId = `uq-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const totalSize = file.size;
        let start = 0;

        while (start < totalSize) {
          const end = Math.min(start + CHUNK_SIZE, totalSize);
          const chunk = file.slice(start, end);
          const form = new FormData();
          form.append('file', chunk);
          form.append('api_key', apiKey);
          form.append('timestamp', timestamp);
          form.append('signature', signature);
          form.append('folder', folder);

          const chunkRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'X-Unique-Upload-Id': uniqueUploadId,
              'Content-Range': `bytes ${start}-${end - 1}/${totalSize}`,
            },
            body: form,
          });

          const chunkData = await chunkRes.json();
          if (end === totalSize) {
            data = chunkData; // Son chunk — final sonuç
          }
          start = end;
        }
      }

      if (data.secure_url) {
        const id = data.public_id.split('/').pop() || 'f';
        const fn = encodeURIComponent(file.name);
        const imgUrl = encodeURIComponent(data.secure_url);
        const type = encodeURIComponent(file.type);
        const viewPath = isImage ? 'photo' : 'file';
        const viewUrl = `${window.location.origin}/${viewPath}/${id}?url=${imgUrl}&fn=${fn}&type=${type}`;
        setUploadedUrl(viewUrl);
      } else {
        throw new Error(data.error?.message || 'Yükleme başarısız');
      }
    } catch (err: any) {
      setUploadError("Yükleme başarısız: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDownloadQR = (fmt: "png" | "svg") => {
    if (!qrDataUrl || !uploadedUrl) return;
    const base = fileName.replace(/\.[^.]+$/, "") || "file";
    if (fmt === "png") {
      const a = document.createElement("a"); a.href = qrDataUrl; a.download = `qr_${base}.png`; a.click();
    } else {
      import("qrcode").then(mod => {
        mod.default.toString(uploadedUrl, { type: "svg", margin: 2, color: { dark: fgColor, light: bgColor }, errorCorrectionLevel: errorLevel })
          .then(svg => {
            const blob = new Blob([svg], { type: "image/svg+xml" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `qr_${base}.svg`; a.click(); URL.revokeObjectURL(a.href);
          });
      });
    }
  };

  const spin = { animation: "spin 1s linear infinite" } as React.CSSProperties;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", alignItems: "center", maxWidth: "700px", margin: "0 auto" }}>

      <div style={{ width: "100%", marginTop: "0.5rem" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.9rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Ana Sayfaya Dön
        </Link>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ width: "70px", height: "70px", borderRadius: "18px", background: "linear-gradient(135deg, #f59e0b, #ef4444)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", boxShadow: "0 8px 30px rgba(245,158,11,0.35)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M8 13h2v2h-2z M12 13h4v2h-4z M8 17h8"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, background: "linear-gradient(135deg, #f59e0b, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.5rem" }}>
          Dosya → QR
        </h1>
        <p className="subtitle" style={{ margin: 0 }}>Fotoğraf, PDF, Word, ZIP veya herhangi bir dosyayı QR koda dönüştür.</p>
      </div>

      {/* Yükleme Alanı */}
      <div className="glass-panel" style={{ width: "100%", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Dosya Seç</p>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: isDragging ? "2px dashed #f59e0b" : "2px dashed rgba(255,255,255,0.15)",
            borderRadius: "12px", padding: "2rem", textAlign: "center", cursor: "pointer",
            background: isDragging ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.02)",
            transition: "all 0.2s ease",
          }}
        >
          {preview ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <img src={preview} alt="Önizleme" style={{ maxHeight: "150px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain" }} />
              <p style={{ fontSize: "0.82rem", opacity: 0.6 }}>{fileName} — değiştirmek için tıkla</p>
            </div>
          ) : fileIcon ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ fontSize: "3.5rem" }}>{fileIcon}</div>
              <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{fileName}</p>
              <p style={{ fontSize: "0.78rem", opacity: 0.5 }}>{fileMime} — değiştirmek için tıkla</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", opacity: 0.5 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p style={{ fontSize: "0.9rem" }}>Dosya sürükle veya tıkla</p>
              <p style={{ fontSize: "0.75rem" }}>Fotoğraf, PDF, Word, ZIP, ses, video — her şey</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="*/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

        {uploading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", opacity: 0.7 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={spin}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span style={{ fontSize: "0.82rem", color: "#f59e0b" }}>Dosya yükleniyor...</span>
          </div>
        )}
        {uploadedUrl && !uploading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
            <span style={{ fontSize: "0.82rem", color: "#4ade80" }}>Yüklendi — QR oluşturuldu ✓</span>
          </div>
        )}
        {uploadError && <p style={{ fontSize: "0.82rem", color: "#ef4444" }}>{uploadError}</p>}
      </div>

      {/* QR Tasarımı */}
      {uploadedUrl && (
        <div className="glass-panel" style={{ width: "100%", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>QR Tasarımı</p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "120px" }}>
              <label style={{ fontSize: "0.75rem", opacity: 0.5, display: "block", marginBottom: "0.3rem" }}>QR Rengi</label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} style={{ width: "40px", height: "36px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", background: "none", padding: "2px" }} />
                <span style={{ fontSize: "0.8rem", fontFamily: "monospace", opacity: 0.7 }}>{fgColor.toUpperCase()}</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: "120px" }}>
              <label style={{ fontSize: "0.75rem", opacity: 0.5, display: "block", marginBottom: "0.3rem" }}>Arka Plan</label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: "40px", height: "36px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", background: "none", padding: "2px" }} />
                <span style={{ fontSize: "0.8rem", fontFamily: "monospace", opacity: 0.7 }}>{bgColor.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
              <label style={{ fontSize: "0.75rem", opacity: 0.5 }}>QR Boyutu</label>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.7 }}>{qrSize}px</span>
            </div>
            <input type="range" min={200} max={800} step={50} value={qrSize} onChange={e => setQrSize(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#f59e0b", cursor: "pointer" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", opacity: 0.5, display: "block", marginBottom: "0.3rem" }}>Hata Düzeltme</label>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {(["L","M","Q","H"] as const).map(lvl => (
                <button key={lvl} onClick={() => setErrorLevel(lvl)} style={{
                  flex: 1, padding: "0.4rem", borderRadius: "6px",
                  border: errorLevel === lvl ? "1.5px solid #f59e0b" : "1.5px solid rgba(255,255,255,0.08)",
                  background: errorLevel === lvl ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)",
                  color: errorLevel === lvl ? "#f59e0b" : "rgba(255,255,255,0.5)",
                  cursor: "pointer", fontSize: "0.82rem", fontWeight: 700,
                }}>{lvl}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QR Önizleme */}
      {uploadedUrl && (
        <div className="glass-panel" style={{ width: "100%", padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em", alignSelf: "flex-start" }}>QR Önizleme</p>
          <div style={{ width: "min(280px, 100%)", aspectRatio: "1", borderRadius: "12px", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            {generating ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={fgColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={spin}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : null}
          </div>
          {qrDataUrl && (
            <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
              <button onClick={() => handleDownloadQR("png")} className="btn" style={{ flex: 1, background: "linear-gradient(135deg, #f59e0b, #ef4444)", fontSize: "0.88rem", padding: "0.7rem" }}>
                PNG İndir
              </button>
              <button onClick={() => handleDownloadQR("svg")} className="btn btn-secondary" style={{ flex: 1, fontSize: "0.88rem", padding: "0.7rem" }}>
                SVG İndir
              </button>
            </div>
          )}
          <p style={{ fontSize: "0.72rem", opacity: 0.35, textAlign: "center" }}>
            QR tarandığında dosya sayfası açılır ve indirilebilir.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
