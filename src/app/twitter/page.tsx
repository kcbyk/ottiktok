"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Twitter/X İkonu ── */
function XIcon({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function TwitterPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/twitter", {
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

  const openPlatform = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile = /android|iphone|ipad|ipod/i.test(userAgent);
    
    if (isMobile) {
      const start = Date.now();
      window.location.href = "twitter://";
      setTimeout(() => {
        if (Date.now() - start < 2000) {
          window.location.href = "https://x.com/";
        }
      }, 1000);
    } else {
      window.open("https://x.com/", "_blank");
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Ana Sayfaya Dön
        </Link>
      </div>

      {/* Başlık */}
      <div style={{ textAlign: "center" }}>
        {/* Twitter İkonu */}
        <div 
          onClick={openPlatform}
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "18px",
            background: "#000000",
            border: "1.5px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
            boxShadow: "0 8px 30px rgba(29,161,242,0.3)",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 12px 35px rgba(29,161,242,0.55)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(29,161,242,0.3)";
          }}
          title="Twitter/X Uygulamasını/Sanal Sayfasını Aç"
        >
          <XIcon size={34} />
        </div>
        <h1>Twitter/X İndirici</h1>
        <p className="subtitle">Videoları ve GIF'leri reklamsız ve doğrudan indirin.</p>
      </div>

      <div className="glass-panel" style={{ width: "100%", maxWidth: "650px" }}>
        <form onSubmit={handleDownload} className="input-group">
          <input
            type="text"
            className="url-input"
            placeholder="Twitter/X video linkini buraya yapıştırın..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="button" className="btn btn-secondary" onClick={handlePaste} style={{ padding: "0.5rem 1.5rem" }}>
            Yapıştır
          </button>
          <button type="submit" className="btn" disabled={loading || !url} style={{ background: "#1DA1F2" }}>
            {loading ? "İşleniyor..." : "İndir"}
          </button>
        </form>
      </div>

      {error && (
        <div className="glass-panel" style={{ width: "100%", maxWidth: "650px", border: "1px solid #ef4444", background: "rgba(239,68,68,0.1)", padding: "1rem 2rem" }}>
          <p style={{ color: "#ef4444", textAlign: "center", fontWeight: "600" }}>{error}</p>
        </div>
      )}

      {result && (
        <div className="glass-panel" style={{ width: "100%", maxWidth: "650px", display: "flex", flexDirection: "column", gap: "1.5rem", animation: "fadeIn 0.5s ease" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            {result.cover && (
              <img src={result.cover} alt="Video Kapak Resmi" style={{ width: "140px", borderRadius: "12px", objectFit: "cover", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }} />
            )}
            <div style={{ flex: 1, minWidth: "250px" }}>
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1.2rem" }}>{result.author || "Twitter Kullanıcısı"}</h3>
              <p style={{ opacity: 0.8, fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: "1.4" }}>{result.title}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {result.videos && result.videos.map((v: any, idx: number) => (
                  <a 
                    key={idx}
                    href={`/api/force-download?url=${encodeURIComponent(v.url)}&filename=twitter_video_${idx + 1}.mp4`} 
                    className="btn" 
                    style={{ textDecoration: "none", background: idx === 0 ? "#1DA1F2" : "rgba(255,255,255,0.08)" }}
                  >
                    İndir ({v.quality})
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ width: "100%", marginTop: "2rem", marginBottom: "4rem" }}>
        <h2 style={{ textAlign: "center", marginBottom: "2rem", fontSize: "1.5rem" }}>Nasıl Kullanılır?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", textAlign: "center" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1DA1F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(29,161,242,0.4))" }}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Bir video bulun</h3>
            <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>Twitter/X uygulamasında veya web sitesinde indirmek istediğiniz videolu tweeti açın.</p>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1DA1F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(29,161,242,0.4))" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Linki kopyalayın</h3>
            <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>Tweet paylaşım butonuna dokunun ve &quot;Bağlantıyı Kopyala&quot;yı seçin.</p>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1DA1F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(29,161,242,0.4))" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Yapıştırıp İndirin</h3>
            <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>Kopyaladığınız linki yukarıdaki alana yapıştırın ve İndir butonuna tıklayın.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
