"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Tipler ── */
type Media = { url: string; quality: string; type: "video" | "image" };
type Pinner = { username: string; profileUrl: string | null };
type PinResult = {
  title: string | null;
  cover: string | null;
  medias: Media[];
  pinner: Pinner | null;
};

type ProfilePin = { id: string; pinUrl: string; thumbnail: string | null; title?: string };
type ProfileData = {
  name: string; username: string; avatar: string | null;
  description: string | null; profileUrl: string;
};
type ProfileResult = { profile: ProfileData; pins: ProfilePin[]; total: number };
type PinDownloaded = { title: string | null; cover: string | null; medias: Media[] };

/* ── Pinterest İkonu ── */
function PIcon({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

/* ── İndirme Butonu ── */
function DownloadBtn({ media, filename }: { media: Media; filename: string }) {
  const ext = media.type === "video" ? "mp4" : "jpg";
  return (
    <a
      href={`/api/force-download?url=${encodeURIComponent(media.url)}&filename=${filename}.${ext}`}
      className="btn"
      style={{
        textDecoration: "none",
        background: "#E60023",
        color: "white",
        fontSize: "0.85rem",
        padding: "0.5rem 1rem",
        display: "block",
        textAlign: "center",
      }}
    >
      {media.type === "video" ? `Video İndir (${media.quality})` : "Fotoğraf İndir"}
    </a>
  );
}

export default function PinterestPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [pinResult, setPinResult] = useState<PinResult | null>(null);
  const [profileResult, setProfileResult] = useState<ProfileResult | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"pin" | "profile" | null>(null);

  // Profil pin'leri için indirme durumu
  const [loadingPins, setLoadingPins] = useState<Set<string>>(new Set());
  const [downloadedPins, setDownloadedPins] = useState<Record<string, PinDownloaded>>({});

  /* ── Birleşik İndirme Fonksiyonu ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setPinResult(null);
    setProfileResult(null);
    setMode(null);

    try {
      const res = await fetch("/api/pinterest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bir hata oluştu");

      if (data.mode === "pin") {
        setMode("pin");
        setPinResult(data.pinResult);
      } else if (data.mode === "profile") {
        setMode("profile");
        setProfileResult(data.profileResult);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Profil pinini indir ── */
  const downloadProfilePin = async (pin: ProfilePin) => {
    if (!pin.id || loadingPins.has(pin.id) || downloadedPins[pin.id]) return;
    setLoadingPins(prev => new Set(prev).add(pin.id));
    try {
      const res = await fetch("/api/pinterest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pin.pinUrl }),
      });
      const data = await res.json();
      if (res.ok && data.mode === "pin") {
        setDownloadedPins(prev => ({ ...prev, [pin.id]: data.pinResult }));
      }
    } catch {
      // sessizce geç
    } finally {
      setLoadingPins(prev => { const s = new Set(prev); s.delete(pin.id); return s; });
    }
  };

  /* ── Pinner profiline git ── */
  const openPinnerProfile = async (profileUrl: string) => {
    setUrl(profileUrl);
    setLoading(true);
    setPinResult(null);
    setProfileResult(null);
    setError("");
    setMode(null);
    try {
      const res = await fetch("/api/pinterest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: profileUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Profil yüklenemedi");

      if (data.mode === "profile") {
        setMode("profile");
        setProfileResult(data.profileResult);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try { const t = await navigator.clipboard.readText(); setUrl(t); } catch { /* ignore */ }
  };

  const openPlatform = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile = /android|iphone|ipad|ipod/i.test(userAgent);
    
    if (isMobile) {
      const start = Date.now();
      window.location.href = "pinterest://";
      setTimeout(() => {
        if (Date.now() - start < 2000) {
          window.location.href = "https://www.pinterest.com/";
        }
      }, 1000);
    } else {
      window.open("https://www.pinterest.com/", "_blank");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", alignItems: "center" }}>

      {/* ── Geri Butonu ── */}
      <div style={{ width: "100%", maxWidth: "700px", marginTop: "2rem" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.9rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Ana Sayfaya Dön
        </Link>
      </div>

      {/* ── Başlık ── */}
      <div style={{ textAlign: "center" }}>
        <div 
          onClick={openPlatform}
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "18px",
            background: "#E60023",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
            boxShadow: "0 8px 30px rgba(230,0,35,0.35)",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 12px 35px rgba(230,0,35,0.5)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(230,0,35,0.35)";
          }}
          title="Pinterest Uygulamasını/Sanal Sayfasını Aç"
        >
          <PIcon size={38} />
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#E60023", marginBottom: "0.5rem" }}>Pinterest İndirici</h1>
        <p className="subtitle">Pin linki veya profil linki yapıştırın</p>
      </div>

      {/* ── Form ── */}
      <div className="glass-panel" style={{ width: "100%", maxWidth: "700px" }}>
        <form onSubmit={handleSubmit} className="input-group">
          <input
            type="text" className="url-input"
            placeholder="pinterest.com/pin/... veya pinterest.com/kullanici/"
            value={url} onChange={e => setUrl(e.target.value)} required
          />
          <button type="button" className="btn btn-secondary" onClick={handlePaste} style={{ padding: "0.5rem 1.5rem" }}>Yapıştır</button>
          <button type="submit" className="btn" disabled={loading || !url} style={{ background: "#E60023" }}>
            {loading ? "Yükleniyor..." : "İndir"}
          </button>
        </form>
      </div>

      {/* ── Hata ── */}
      {error && (
        <div className="glass-panel" style={{ width: "100%", maxWidth: "700px", border: "1px solid #ef4444", background: "rgba(239,68,68,0.1)", padding: "1rem 2rem" }}>
          <p style={{ color: "#ef4444", textAlign: "center", fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {/* ══════════ TEK PIN SONUCU (TikTok gibi) ══════════ */}
      {pinResult && mode === "pin" && (
        <div className="glass-panel" style={{ width: "100%", maxWidth: "700px", display: "flex", flexDirection: "column", gap: "1.5rem", animation: "fadeIn 0.5s ease" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap", width: "100%" }}>

            {/* Sol: Thumbnail */}
            <div style={{ position: "relative", width: "140px" }}>
              {pinResult.cover && (
                <img src={pinResult.cover} alt="Kapak" style={{ width: "140px", borderRadius: "12px", objectFit: "cover", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }} />
              )}
            </div>

            {/* Sağ: Kullanıcı adı, Başlık, İndirme butonları */}
            <div style={{ flex: 1, minWidth: "250px", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              
              {/* Kullanıcı adı (Ufak, Thumbnail'ın hemen yanında görünecek şekilde sağ sütunun üstünde) */}
              {pinResult.pinner && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={() => pinResult.pinner?.profileUrl && openPinnerProfile(pinResult.pinner.profileUrl)}
                    style={{
                      background: "rgba(230,0,35,0.12)",
                      border: "1px solid rgba(230,0,35,0.25)",
                      borderRadius: "16px",
                      padding: "0.2rem 0.5rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      cursor: "pointer",
                      color: "#E60023",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                    title={`${pinResult.pinner.username} profilini gör`}
                  >
                    <PIcon size={11} />
                    @{pinResult.pinner.username}
                  </button>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>tıklayarak diğer pinlerini görün</span>
                </div>
              )}

              {pinResult.title && (
                <p style={{ opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.4", margin: 0 }}>
                  {pinResult.title}
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                {pinResult.medias.length > 0 ? (
                  pinResult.medias.map((m, i) => (
                    <DownloadBtn key={i} media={m} filename={`pinterest_${m.type}_${i + 1}`} />
                  ))
                ) : (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>İndirilebilir medya bulunamadı.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ PROFİL SONUCU (Her fotoğrafın altında İndir butonu ile) ══════════ */}
      {profileResult && mode === "profile" && (
        <div style={{ width: "100%", maxWidth: "700px", display: "flex", flexDirection: "column", gap: "1.25rem", animation: "fadeIn 0.5s ease" }}>

          {/* Profil başlığı */}
          <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            {profileResult.profile.avatar
              ? <img src={profileResult.profile.avatar} alt="Avatar" style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "3px solid #E60023" }} />
              : <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#E60023", display: "flex", alignItems: "center", justifyContent: "center" }}><PIcon size={28} /></div>
            }
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.15rem" }}>{profileResult.profile.name}</h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>@{profileResult.profile.username} · {profileResult.total} pin</p>
            </div>
            <a href={profileResult.profile.profileUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: "#E60023", textDecoration: "none", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              Pinterest&apos;te Gör ↗
            </a>
          </div>

          {/* Pin Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "0.85rem" }}>
            {profileResult.pins.map((pin, i) => {
              const dl = pin.id ? downloadedPins[pin.id] : null;
              const isLoading = pin.id ? loadingPins.has(pin.id) : false;

              return (
                <div key={pin.id || i} className="glass-panel" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  {/* Thumbnail */}
                  <div style={{ position: "relative", aspectRatio: "1" }}>
                    {pin.thumbnail
                      ? <img src={pin.thumbnail} alt={`Pin ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>📌</div>
                    }
                  </div>

                  {/* Alt kısım: İndir butonu (her fotoğrafın altında) */}
                  <div style={{ padding: "0.5rem" }}>
                    {!dl && !isLoading && pin.id && (
                      <button
                        onClick={() => downloadProfilePin(pin)}
                        style={{
                          width: "100%", background: "#E60023", color: "white",
                          border: "none", borderRadius: "8px", padding: "0.45rem",
                          fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                      >
                        İndir
                      </button>
                    )}

                    {isLoading && (
                      <div style={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", padding: "0.45rem" }}>
                        Yükleniyor...
                      </div>
                    )}

                    {dl && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        {dl.medias && dl.medias.length > 0 ? (
                          dl.medias.map((m, mi) => {
                            const ext = m.type === "video" ? "mp4" : "jpg";
                            return (
                              <a key={mi}
                                href={`/api/force-download?url=${encodeURIComponent(m.url)}&filename=pin_${pin.id}_${mi + 1}.${ext}`}
                                style={{
                                  display: "block", textAlign: "center", textDecoration: "none",
                                  background: "#22c55e", color: "white", borderRadius: "8px",
                                  padding: "0.45rem", fontSize: "0.75rem", fontWeight: 600,
                                }}
                              >
                                {m.type === "video" ? "Videoyu İndir" : "Resmi İndir"}
                              </a>
                            );
                          })
                        ) : (
                          <div style={{ textAlign: "center", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", padding: "0.3rem" }}>
                            Medya bulunamadı
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Nasıl Kullanılır ── */}
      {!pinResult && !profileResult && (
        <div className="glass-panel" style={{ width: "100%", marginTop: "1rem", marginBottom: "4rem" }}>
          <h2 style={{ textAlign: "center", marginBottom: "2rem", fontSize: "1.5rem" }}>Nasıl Kullanılır?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", textAlign: "center" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E60023" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(230,0,35,0.4))" }}>
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                  <path d="M12 18h.01"/>
                </svg>
              </div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Pin İndir</h3>
              <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>Tek bir pin URL&apos;si yapıştırın → video veya fotoğraf iner.</p>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E60023" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(230,0,35,0.4))" }}>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Profil Gör</h3>
              <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>Profil URL&apos;si yapıştırın ya da pin&apos;den @username&apos;e tıklayın → tüm pinleri görün.</p>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E60023" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(230,0,35,0.4))" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Seçerek İndir</h3>
              <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>Profil grid&apos;inde her pin&apos;in altındaki İndir butonuna bas.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
