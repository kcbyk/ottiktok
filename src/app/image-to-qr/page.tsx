"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

export default function ImageToQRPage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [qrSize, setQrSize] = useState(400);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("H");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateQR = useCallback(async (dataUrl: string) => {
    if (!dataUrl) return;
    setGenerating(true);
    try {
      const QRCode = (await import("qrcode")).default;
      // Fotoğraf için: dataUrl'yi QR içeriği olarak kodla (yüksek hata düzeltme)
      const qr = await QRCode.toDataURL(dataUrl, {
        width: qrSize,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      });
      setQrDataUrl(qr);
    } catch (err) {
      console.error("QR oluşturma hatası:", err);
    } finally {
      setGenerating(false);
    }
  }, [qrSize, fgColor, bgColor, errorLevel]);

  useEffect(() => {
    if (!image) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => generateQR(image), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [image, generateQR]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Görsel kalitesini maksimumda tut — canvas ile yeniden boyutlandır
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Maksimum 2048px — QR için yeterli, daha büyüğü veri limitini aşar
        const maxDim = 512;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
          else { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        // En yüksek kalitede JPEG (0.98)
        const compressed = canvas.toDataURL("image/jpeg", 0.98);
        setImage(compressed);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDownload = (fmt: "png" | "svg") => {
    if (!qrDataUrl || !image) return;
    if (fmt === "png") {
      const a = document.createElement("a");
      a.href = qrDataUrl;
      a.download = `qr_${imageName.replace(/\.[^.]+$/, "") || "image"}.png`;
      a.click();
    } else {
      import("qrcode").then(mod => {
        mod.default.toString(image, {
          type: "svg", margin: 2,
          color: { dark: fgColor, light: bgColor },
          errorCorrectionLevel: errorLevel,
        }).then(svg => {
          const blob = new Blob([svg], { type: "image/svg+xml" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `qr_${imageName.replace(/\.[^.]+$/, "") || "image"}.svg`;
          a.click();
          URL.revokeObjectURL(a.href);
        });
      });
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    color: "white",
    padding: "0.65rem 0.85rem",
    fontSize: "0.9rem",
    outline: "none",
    width: "100%",
  } as React.CSSProperties;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", alignItems: "center", maxWidth: "700px", margin: "0 auto" }}>

      {/* Geri */}
      <div style={{ width: "100%", marginTop: "0.5rem" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.9rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Ana Sayfaya Dön
        </Link>
      </div>

      {/* Başlık */}
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "70px", height: "70px", borderRadius: "18px", background: "linear-gradient(135deg, #f59e0b, #ef4444)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", boxShadow: "0 8px 30px rgba(245,158,11,0.35)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <path d="M14 14h2v2h-2z"/><path d="M18 14h3v2h-3z"/><path d="M14 18h2v3h-2z"/><path d="M18 18h3v3h-3z"/>
            <path d="M7 7h.01M17 7h.01M7 17h.01"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, background: "linear-gradient(135deg, #f59e0b, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.5rem" }}>
          Fotoğraf → QR
        </h1>
        <p className="subtitle" style={{ margin: 0 }}>Fotoğrafı yükle, anında QR koduna dönüştür ve indir.</p>
      </div>

      {/* Yükleme Alanı */}
      <div
        className="glass-panel"
        style={{ width: "100%", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fotoğraf Seç</p>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: isDragging ? "2px dashed #f59e0b" : "2px dashed rgba(255,255,255,0.15)",
            borderRadius: "12px",
            padding: "2rem",
            textAlign: "center",
            cursor: "pointer",
            background: isDragging ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.02)",
            transition: "all 0.2s ease",
          }}
        >
          {image ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <img src={image} alt="Yüklenen" style={{ maxHeight: "150px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain" }} />
              <p style={{ fontSize: "0.82rem", opacity: 0.6 }}>{imageName} — değiştirmek için tıkla</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", opacity: 0.5 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <p style={{ fontSize: "0.88rem" }}>Fotoğraf sürükle veya tıkla</p>
              <p style={{ fontSize: "0.75rem" }}>JPG, PNG, WebP, GIF</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {/* Tasarım Ayarları */}
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
          <label style={{ fontSize: "0.75rem", opacity: 0.5, display: "block", marginBottom: "0.3rem" }}>Hata Düzeltme (H = en yüksek kalite)</label>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {(["L","M","Q","H"] as const).map(lvl => (
              <button key={lvl} onClick={() => setErrorLevel(lvl)}
                style={{ flex: 1, padding: "0.4rem", borderRadius: "6px",
                  border: errorLevel === lvl ? "1.5px solid #f59e0b" : "1.5px solid rgba(255,255,255,0.08)",
                  background: errorLevel === lvl ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)",
                  color: errorLevel === lvl ? "#f59e0b" : "rgba(255,255,255,0.5)",
                  cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}>
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* QR Önizleme + İndir */}
      {image && (
        <div className="glass-panel" style={{ width: "100%", padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em", alignSelf: "flex-start" }}>QR Önizleme</p>

          <div style={{ width: "min(300px, 100%)", aspectRatio: "1", borderRadius: "12px", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            {generating ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={fgColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", opacity: 0.5 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Kod" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : null}
          </div>

          {qrDataUrl && (
            <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
              <button onClick={() => handleDownload("png")} className="btn" style={{ flex: 1, background: "linear-gradient(135deg, #f59e0b, #ef4444)", fontSize: "0.88rem", padding: "0.7rem" }}>
                PNG İndir
              </button>
              <button onClick={() => handleDownload("svg")} className="btn btn-secondary" style={{ flex: 1, fontSize: "0.88rem", padding: "0.7rem" }}>
                SVG İndir
              </button>
            </div>
          )}

          <p style={{ fontSize: "0.72rem", opacity: 0.4, textAlign: "center" }}>
            Not: Fotoğraf verisi QR'a gömülür. Büyük fotoğraflar daha yoğun QR üretir.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
