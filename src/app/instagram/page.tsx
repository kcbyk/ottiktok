"use client";

import { useState } from "react";
import Link from "next/link";

export default function InstagramPage() {
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
      const res = await fetch("/api/instagram", {
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
      window.location.href = "instagram://";
      setTimeout(() => {
        if (Date.now() - start < 2000) {
          window.location.href = "https://www.instagram.com/";
        }
      }, 1000);
    } else {
      window.open("https://www.instagram.com/", "_blank");
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
        {/* Instagram Gradient İkon */}
        <div 
          onClick={openPlatform}
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
            boxShadow: "0 8px 30px rgba(220,39,67,0.35)",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 12px 35px rgba(220,39,67,0.5)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(220,39,67,0.35)";
          }}
          title="Instagram Uygulamasını/Sanal Sayfasını Aç"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        </div>
        <h1 style={{
          fontSize: "2.5rem",
          fontWeight: 800,
          background: "linear-gradient(135deg, #f09433, #dc2743, #bc1888)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}>
          Instagram İndirici
        </h1>
        <p className="subtitle">Reels ve fotoğrafları reklamsız indirin.</p>
      </div>

      {/* Form */}
      <div className="glass-panel" style={{ width: "100%", maxWidth: "650px" }}>
        <form onSubmit={handleDownload} className="input-group">
          <input
            type="text"
            className="url-input"
            placeholder="Instagram Reels veya gönderi linkini yapıştırın..."
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
            style={{ background: "linear-gradient(135deg, #e6683c, #dc2743, #bc1888)" }}
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
                {result.play && (
                  <a href={`/api/force-download?url=${encodeURIComponent(result.play)}&filename=instagram_video.mp4`} className="btn" style={{ textDecoration: "none", background: "linear-gradient(135deg, #e6683c, #dc2743, #bc1888)" }}>
                    Videoyu İndir (MP4)
                  </a>
                )}
                {result.images && result.images.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: "0.75rem" }}>Fotoğraflar ({result.images.length})</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.75rem" }}>
                      {result.images.map((img: string, idx: number) => (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <img src={img} alt={`Foto ${idx + 1}`} style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "8px" }} />
                          <a href={`/api/force-download?url=${encodeURIComponent(img)}&filename=instagram_photo_${idx + 1}.jpeg`} className="btn" style={{ padding: "0.4rem", fontSize: "0.8rem", background: "linear-gradient(135deg, #e6683c, #dc2743)" }}>
                            İndir
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2743" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(220,39,67,0.4))" }}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>İçeriği bulun</h3>
            <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>Instagram&apos;da indirmek istediğiniz Reels veya gönderiyi açın.</p>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2743" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(220,39,67,0.4))" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Linki kopyalayın</h3>
            <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>&quot;Paylaş&quot; butonuna dokunun ve &quot;Bağlantıyı Kopyala&quot;yı seçin.</p>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2743" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(220,39,67,0.4))" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Buraya yapıştırıp İndirin</h3>
            <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>Kopyaladığınız linki yukarıdaki alana yapıştırın ve İndir&apos;e basın.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
