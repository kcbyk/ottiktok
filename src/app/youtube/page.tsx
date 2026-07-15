"use client";

import { useState } from "react";
import Link from "next/link";

// YouTube CDN URL'leri client IP'sine değil server IP'sine signed.
// itag varsa server-side stream (youtube-dl), yoksa direkt link.
function openDirectDownload(url: string, filename: string, videoId?: string, itag?: string) {
  let href: string;
  if (videoId && itag) {
    // Server-side stream — Vercel'in IP'siyle fetch edilir, mobilde çalışır
    href = `/api/youtube-dl?videoId=${encodeURIComponent(videoId)}&itag=${encodeURIComponent(itag)}&filename=${encodeURIComponent(filename)}`;
  } else {
    href = `/api/force-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
  }
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ── YouTube İkonu ── */
function YTIcon({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function YouTubePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const openPlatform = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile = /android|iphone|ipad|ipod/i.test(userAgent);
    
    if (isMobile) {
      const start = Date.now();
      window.location.href = "vnd.youtube://";
      setTimeout(() => {
        if (Date.now() - start < 2000) {
          window.location.href = "https://www.youtube.com/";
        }
      }, 1000);
    } else {
      window.open("https://www.youtube.com/", "_blank");
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bir hata oluştu");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      console.error("Panoya erişilemedi");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", alignItems: "center" }}>

      {/* Geri Butonu */}
      <div style={{ width: "100%", maxWidth: "650px", marginTop: "2rem" }}>
        <Link href="/" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "rgba(255,255,255,0.6)",
          textDecoration: "none",
          fontSize: "0.9rem",
          transition: "color 0.2s",
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Ana Sayfaya Dön
        </Link>
      </div>

      {/* Başlık */}
      <div style={{ textAlign: "center" }}>
        {/* YouTube İkonu */}
        <div 
          onClick={openPlatform}
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "18px",
            background: "#FF0000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
            boxShadow: "0 8px 30px rgba(255,0,0,0.35)",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 12px 35px rgba(255,0,0,0.55)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(255,0,0,0.35)";
          }}
          title="YouTube Uygulamasını/Sanal Sayfasını Aç"
        >
          <YTIcon size={38} />
        </div>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: 800,
          background: "linear-gradient(135deg, #FF0000, #ff4444)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}>
          YouTube İndirici
        </h1>
        <p className="subtitle">Videolar ve Shorts&apos;ları reklamsız indirin.</p>
      </div>

      {/* Form */}
      <div className="glass-panel" style={{ width: "100%", maxWidth: "650px" }}>
        <form onSubmit={handleDownload} className="input-group">
          <input
            type="text"
            className="url-input"
            placeholder="YouTube video veya Shorts linkini yapıştırın..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="button" className="btn btn-secondary" onClick={handlePaste} style={{ padding: "0.5rem 1.5rem" }}>
            Yapıştır
          </button>
          <button
            type="submit"
            className="btn"
            disabled={loading || !url}
            style={{ background: "#FF0000" }}
          >
            {loading ? "İşleniyor..." : "İndir"}
          </button>
        </form>
      </div>

      {/* Hata */}
      {error && (
        <div className="glass-panel" style={{ width: "100%", maxWidth: "650px", border: "1px solid #ef4444", background: "rgba(239,68,68,0.1)", padding: "1rem 2rem" }}>
          <p style={{ color: "#ef4444", textAlign: "center", fontWeight: "600" }}>{error}</p>
        </div>
      )}

      {/* Sonuç */}
      {result && (
        <div className="glass-panel" style={{ width: "100%", maxWidth: "650px", display: "flex", flexDirection: "column", gap: "1.5rem", animation: "fadeIn 0.5s ease" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            {result.cover && (
              <img src={result.cover} alt="Kapak" style={{ width: "140px", borderRadius: "12px", objectFit: "cover" }} />
            )}
            <div style={{ flex: 1, minWidth: "200px" }}>
              {result.author && <h3 style={{ marginBottom: "0.5rem" }}>{result.author}</h3>}
              {result.title && <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: "1.25rem", lineHeight: "1.4" }}>{result.title}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {result.formats && result.formats.map((fmt: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => openDirectDownload(
                      fmt.url,
                      `youtube_video_${fmt.quality.replace(/[^a-z0-9]/gi,'_')}.mp4`,
                      result.videoId,
                      fmt.itag
                    )}
                    className="btn"
                    style={{ background: i === 0 ? "#FF0000" : "rgba(255,255,255,0.1)", color: "white", border: i !== 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}
                  >
                    İndir — {fmt.quality}
                  </button>
                ))}
                {result.music && (
                  <button
                    onClick={() => openDirectDownload(result.music, 'youtube_audio.mp3')}
                    className="btn btn-secondary"
                  >
                    Sesi İndir (MP3)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nasıl Kullanılır */}
      <div className="glass-panel" style={{ width: "100%", marginTop: "1rem", marginBottom: "4rem" }}>
        <h2 style={{ textAlign: "center", marginBottom: "2rem", fontSize: "1.5rem" }}>Nasıl Kullanılır?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", textAlign: "center" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(255,0,0,0.4))" }}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Videoyu bulun</h3>
            <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>YouTube&apos;da indirmek istediğiniz video veya Shorts&apos;ı açın.</p>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(255,0,0,0.4))" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Linki kopyalayın</h3>
            <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>Adres çubuğundan veya &quot;Paylaş&quot; butonundan linki kopyalayın.</p>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(255,0,0,0.4))" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Buraya yapıştırıp İndirin</h3>
            <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>Linki yukarıdaki alana yapıştırın ve kaliteyi seçerek indirin.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
