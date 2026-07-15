"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

type Format = "jpeg" | "png" | "webp" | "avif";

interface ConvertOptions {
  format: Format;
  quality: number;
  width: string;
  height: string;
  keepAspect: boolean;
}

function ImgIcon({ size = 34 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

const FORMAT_INFO: Record<Format, { label: string; desc: string; color: string }> = {
  webp: { label: "WebP", desc: "En iyi sıkıştırma", color: "#4ade80" },
  jpeg: { label: "JPG", desc: "Evrensel uyumluluk", color: "#60a5fa" },
  png: { label: "PNG", desc: "Şeffaflık desteği", color: "#a78bfa" },
  avif: { label: "AVIF", desc: "En yeni format", color: "#f59e0b" },
};

export default function ImageConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [opts, setOpts] = useState<ConvertOptions>({
    format: "webp",
    quality: 85,
    width: "",
    height: "",
    keepAspect: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Lütfen geçerli bir görsel dosyası seçin.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("Dosya çok büyük. Maksimum 20MB.");
      return;
    }
    setError("");
    setConvertedUrl(null);
    setConvertedSize(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setConvertedUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", opts.format);
      formData.append("quality", opts.quality.toString());
      if (opts.width) formData.append("width", opts.width);
      if (opts.height) formData.append("height", opts.height);
      formData.append("keepAspect", opts.keepAspect.toString());

      const res = await fetch("/api/convert-image", { method: "POST", body: formData });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Dönüştürme başarısız.");
      }

      const convertedSizeHeader = res.headers.get("X-Converted-Size");
      if (convertedSizeHeader) setConvertedSize(parseInt(convertedSizeHeader, 10));

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setConvertedUrl(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!convertedUrl || !file) return;
    const ext = opts.format === "jpeg" ? "jpg" : opts.format;
    const name = file.name.replace(/\.[^/.]+$/, "") + "_converted." + ext;
    const a = document.createElement("a");
    a.href = convertedUrl;
    a.download = name;
    a.click();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const savings = file && convertedSize
    ? Math.round((1 - convertedSize / file.size) * 100)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center", maxWidth: "700px", margin: "0 auto", padding: "2rem 1rem 5rem" }}>

      {/* Geri Butonu */}
      <div style={{ width: "100%", marginTop: "0.5rem" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.9rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Ana Sayfaya Dön
        </Link>
      </div>

      {/* Başlık */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "70px", height: "70px", borderRadius: "18px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.25rem",
          boxShadow: "0 8px 30px rgba(99,102,241,0.35)",
        }}>
          <ImgIcon size={34} />
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, background: "linear-gradient(135deg, #6366f1, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.5rem" }}>
          Görsel Dönüştürücü
        </h1>
        <p className="subtitle" style={{ margin: 0 }}>JPG, PNG, WebP, AVIF — kalite ve boyut ayarlıyla dönüştür.</p>
      </div>

      {/* Upload Alanı */}
      <div
        className="glass-panel"
        onClick={() => !file && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        style={{
          width: "100%", cursor: file ? "default" : "pointer",
          border: isDragging ? "2px dashed #6366f1" : "2px dashed rgba(255,255,255,0.12)",
          background: isDragging ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.04)",
          borderRadius: "16px", padding: "2rem",
          transition: "all 0.2s ease", textAlign: "center",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />

        {!file ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", opacity: 0.7 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p style={{ fontSize: "1rem", fontWeight: 600 }}>Görsel sürükle & bırak veya tıkla</p>
            <p style={{ fontSize: "0.82rem", opacity: 0.6 }}>JPG, PNG, WebP, AVIF, GIF — Maks. 20MB</p>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            {preview && (
              <img src={preview} alt="Önizleme" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }} />
            )}
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 600, marginBottom: "0.25rem", fontSize: "0.95rem" }}>{file.name}</p>
              <p style={{ opacity: 0.6, fontSize: "0.82rem", marginBottom: "0.75rem" }}>{formatBytes(file.size)}</p>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setConvertedUrl(null); setConvertedSize(null); }}
                className="btn btn-secondary"
                style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}
              >
                Değiştir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ayarlar */}
      {file && (
        <div className="glass-panel" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Format Seçimi */}
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.7, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hedef Format</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {(Object.keys(FORMAT_INFO) as Format[]).map((fmt) => {
                const info = FORMAT_INFO[fmt];
                const isSelected = opts.format === fmt;
                return (
                  <button
                    key={fmt}
                    onClick={() => setOpts(o => ({ ...o, format: fmt }))}
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRadius: "10px",
                      border: isSelected ? `1.5px solid ${info.color}` : "1.5px solid rgba(255,255,255,0.08)",
                      background: isSelected ? `${info.color}18` : "rgba(255,255,255,0.03)",
                      color: isSelected ? info.color : "rgba(255,255,255,0.6)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{info.label}</div>
                    <div style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: "2px" }}>{info.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kalite Ayarı */}
          {opts.format !== "png" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>Kalite</p>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: opts.quality >= 80 ? "#4ade80" : opts.quality >= 60 ? "#f59e0b" : "#f87171" }}>
                  {opts.quality}%
                </span>
              </div>
              <input
                type="range" min={1} max={100} value={opts.quality}
                onChange={(e) => setOpts(o => ({ ...o, quality: parseInt(e.target.value) }))}
                style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                <span style={{ fontSize: "0.72rem", opacity: 0.4 }}>Küçük dosya</span>
                <span style={{ fontSize: "0.72rem", opacity: 0.4 }}>Yüksek kalite</span>
              </div>
            </div>
          )}

          {/* Boyut Ayarı */}
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.7, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Boyut (isteğe bağlı)</p>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="number" placeholder="Genişlik (px)"
                  value={opts.width}
                  onChange={(e) => setOpts(o => ({ ...o, width: e.target.value }))}
                  className="url-input"
                  style={{ width: "140px", padding: "0.6rem 0.75rem", fontSize: "0.88rem" }}
                />
                <span style={{ opacity: 0.4, fontSize: "1rem" }}>×</span>
                <input
                  type="number" placeholder="Yükseklik (px)"
                  value={opts.height}
                  onChange={(e) => setOpts(o => ({ ...o, height: e.target.value }))}
                  className="url-input"
                  style={{ width: "140px", padding: "0.6rem 0.75rem", fontSize: "0.88rem" }}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.85rem", opacity: 0.8 }}>
                <input
                  type="checkbox" checked={opts.keepAspect}
                  onChange={(e) => setOpts(o => ({ ...o, keepAspect: e.target.checked }))}
                  style={{ accentColor: "#6366f1", width: "14px", height: "14px" }}
                />
                Oranı koru
              </label>
            </div>
          </div>

          {/* Dönüştür Butonu */}
          <button
            onClick={handleConvert}
            disabled={loading}
            className="btn"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "1rem", padding: "0.9rem" }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Dönüştürülüyor...
              </span>
            ) : `${FORMAT_INFO[opts.format].label} olarak dönüştür`}
          </button>
        </div>
      )}

      {/* Hata */}
      {error && (
        <div className="glass-panel" style={{ width: "100%", border: "1px solid #ef4444", background: "rgba(239,68,68,0.1)", padding: "1rem 1.5rem" }}>
          <p style={{ color: "#ef4444", textAlign: "center", fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {/* Sonuç */}
      {convertedUrl && file && (
        <div className="glass-panel" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem", animation: "fadeIn 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontWeight: 700, color: "#4ade80" }}>Dönüştürme tamamlandı!</span>
          </div>

          {/* İstatistikler */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {[
              { label: "Orijinal", value: formatBytes(file.size), color: "rgba(255,255,255,0.6)" },
              { label: "Dönüştürülmüş", value: convertedSize ? formatBytes(convertedSize) : "—", color: "#a78bfa" },
              { label: "Tasarruf", value: savings !== null ? (savings > 0 ? `%${savings} küçük` : savings < 0 ? `%${Math.abs(savings)} büyük` : "Aynı boyut") : "—", color: savings && savings > 0 ? "#4ade80" : "#f87171" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center", padding: "0.75rem", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.72rem", opacity: 0.5, marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Önizleme Karşılaştırması */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "0.75rem", opacity: 0.5, marginBottom: "0.4rem" }}>Orijinal</p>
              {preview && <img src={preview} alt="Orijinal" style={{ width: "100%", borderRadius: "8px", objectFit: "cover", maxHeight: "160px" }} />}
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "0.75rem", opacity: 0.5, marginBottom: "0.4rem" }}>Dönüştürülmüş ({FORMAT_INFO[opts.format].label})</p>
              <img src={convertedUrl} alt="Dönüştürülmüş" style={{ width: "100%", borderRadius: "8px", objectFit: "cover", maxHeight: "160px" }} />
            </div>
          </div>

          <button onClick={handleDownload} className="btn" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {FORMAT_INFO[opts.format].label} olarak indir
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
