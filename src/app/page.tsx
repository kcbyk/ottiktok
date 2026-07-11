"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);


  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/download", {
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
      window.location.href = "tiktok://";
      setTimeout(() => {
        if (Date.now() - start < 2000) {
          window.location.href = "https://www.tiktok.com/";
        }
      }, 1000);
    } else {
      window.open("https://www.tiktok.com/", "_blank");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", alignItems: "center" }}>

      {/* ── Sağ Üst Menü Butonu ── */}
      <button
        id="menu-toggle-btn"
        onClick={() => setMenuOpen(true)}
        aria-label="Menüyü Aç"
        style={{
          position: "fixed",
          top: "1.25rem",
          right: "1.25rem",
          zIndex: 1000,
          width: "46px",
          height: "46px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          transition: "all 0.2s ease",
        }}
      >
        {/* Grid / Kutu ikonu */}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </button>

      {/* ── Karartma (Overlay) ── */}
      <div
        onClick={() => setMenuOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1001,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "all" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* ── Sol Sidebar Drawer ── */}
      <div
        id="sidebar-drawer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "300px",
          zIndex: 1002,
          background: "rgba(8,8,8,0.92)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "8px 0 40px rgba(0,0,0,0.6)",
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sidebar Başlık */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#fe2c55", letterSpacing: "0.03em" }}>
            Menü
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Kapat"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Nav Linkleri */}
        <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>

          {/* Instagram */}
          <a
            href="/instagram"
            onClick={() => setMenuOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.85rem 1rem",
              borderRadius: "10px",
              textDecoration: "none",
              color: "white",
              background: "transparent",
              transition: "background 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {/* Instagram Gradient İkon */}
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Instagram İndirici</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Reels ve görseller</div>
            </div>
            {/* Ok ikonu */}
            <svg style={{ marginLeft: "auto", opacity: 0.3 }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>

          {/* Pinterest */}
          <a
            href="/pinterest"
            onClick={() => setMenuOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.85rem 1rem",
              borderRadius: "10px",
              textDecoration: "none",
              color: "white",
              background: "transparent",
              transition: "background 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {/* Pinterest İkon */}
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "#E60023",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Pinterest İndirici</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Video ve fotoğraflar</div>
            </div>
            {/* Ok ikonu */}
            <svg style={{ marginLeft: "auto", opacity: 0.3 }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>

        </nav>
      </div>

      {/* Başlık */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        {/* TikTok İkonu */}
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
            boxShadow: "0 8px 30px rgba(254,44,85,0.3)",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 12px 35px rgba(254,44,85,0.55)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(254,44,85,0.3)";
          }}
          title="TikTok Uygulamasını/Sanal Sayfasını Aç"
        >
          {/* TikTok Nota İkonu */}
          <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="white">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z"/>
          </svg>
        </div>
        <h1>TikTok İndirici</h1>
        <p className="subtitle">Filigransız ve tamamen reklamsız video &amp; ses indirin.</p>
      </div>

      <div className="glass-panel" style={{ width: "100%", maxWidth: "650px" }}>
        <form onSubmit={handleDownload} className="input-group">
          <input
            type="text"
            className="url-input"
            placeholder="TikTok video linkini buraya yapıştırın..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="button" className="btn btn-secondary" onClick={handlePaste} style={{ padding: "0.5rem 1.5rem" }}>
            Yapıştır
          </button>
          <button type="submit" className="btn" disabled={loading || !url}>
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
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1.2rem" }}>{result.author || "TikTok Kullanıcısı"}</h3>
              <p style={{ opacity: 0.8, fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: "1.4" }}>{result.title}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {result.play && (
                  <a href={`/api/force-download?url=${encodeURIComponent(result.play)}&filename=tiktok_video.mp4`} className="btn" style={{ textDecoration: "none" }}>
                    Filigransız İndir (MP4)
                  </a>
                )}
                {result.images && result.images.length > 0 && (
                  <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
                    <h4 style={{ marginBottom: "1rem", fontSize: "1rem" }}>Fotoğraflar ({result.images.length})</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
                      {result.images.map((img: string, idx: number) => (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <img src={img} alt={`Foto ${idx + 1}`} style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
                          <a href={`/api/force-download?url=${encodeURIComponent(img)}&filename=tiktok_photo_${idx + 1}.jpeg`} className="btn" style={{ padding: "0.5rem", fontSize: "0.85rem", width: "100%" }}>
                            İndir
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.music && (
                  <a href={`/api/force-download?url=${encodeURIComponent(result.music)}&filename=tiktok_audio.mp3`} className="btn btn-secondary" style={{ textDecoration: "none" }}>
                    Sesi İndir (MP3)
                  </a>
                )}
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
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fe2c55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(254,44,85,0.4))" }}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Bir video bulun</h3>
            <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>TikTok uygulamasında veya web sitesinde indirmek istediğiniz videoyu açın.</p>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fe2c55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(254,44,85,0.4))" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Linki kopyalayın</h3>
            <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>&quot;Paylaş&quot; butonuna dokunun ve &quot;Bağlantıyı Kopyala&quot;yı seçin.</p>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fe2c55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(254,44,85,0.4))" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Buraya yapıştırıp İndirin</h3>
            <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>Kopyaladığınız linki yukarıdaki alana yapıştırın ve İndir butonuna tıklayın.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
