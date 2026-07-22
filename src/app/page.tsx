"use client";

import Link from "next/link";

function TIcon({ size = 28 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z" />
    </svg>
  );
}
function IIcon({ size = 28 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
function PIcon({ size = 28 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}
function XIcon({ size = 26 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function YIcon({ size = 28 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

const platforms = [
  {
    name: "TikTok",
    desc: "Filigransız video, fotoğraf slaytı ve MP3",
    href: "/tiktok",
    bg: "linear-gradient(135deg, #010101 0%, #1a0a0f 100%)",
    accent: "#fe2c55",
    shadow: "rgba(254,44,85,0.25)",
    icon: <TIcon />,
    badge: "En Popüler",
  },
  {
    name: "Instagram",
    desc: "Reels, hikaye ve çoklu gönderi indirme",
    href: "/instagram",
    bg: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
    accent: "#e1306c",
    shadow: "rgba(225,48,108,0.25)",
    icon: <IIcon />,
  },
  {
    name: "Pinterest",
    desc: "Pin videoları ve toplu fotoğraf indirme",
    href: "/pinterest",
    bg: "linear-gradient(135deg, #a00010, #e60023)",
    accent: "#E60023",
    shadow: "rgba(230,0,35,0.25)",
    icon: <PIcon />,
  },
  {
    name: "Twitter / X",
    desc: "Tweet videoları ve GIF'leri yüksek kalitede",
    href: "/twitter",
    bg: "linear-gradient(135deg, #0a0a0a, #111827)",
    accent: "#1d9bf0",
    shadow: "rgba(29,155,240,0.25)",
    icon: <XIcon />,
  },
];

const tools = [
  {
    name: "Dosya → QR",
    desc: "Her dosyayı QR koda dönüştür",
    href: "/image-to-qr",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    name: "QR Okuyucu",
    desc: "QR kodu okut, içeriği anında aç",
    href: "/qr-reader",
    gradient: "linear-gradient(135deg, #10b981, #0ea5e9)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    name: "QR Oluşturucu",
    desc: "URL, WiFi, e-posta için QR üret",
    href: "/qr-code",
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <path d="M14 14h2v2h-2z"/><path d="M18 14h3v2h-3z"/>
      </svg>
    ),
  },
  {
    name: "Görsel Dönüştürücü",
    desc: "JPG, PNG, WebP, AVIF formatları",
    href: "/image-converter",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    name: "Ses Dönüştürücü",
    desc: "MP3, WAV, OGG, AAC, FLAC",
    href: "/audio-converter",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
    ),
  },
  {
    name: "AI Playlist",
    desc: "Duygu bazlı müzik listesi oluştur",
    href: "/playlist",
    gradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 9l12-2"/>
      </svg>
    ),
  },
];

const stats = [
  { value: "4+", label: "Platform" },
  { value: "10+", label: "Araç" },
  { value: "Ücretsiz", label: "Tamamen" },
  { value: "Reklamsız", label: "Temiz Deneyim" },
];

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4rem", alignItems: "center", width: "100%", maxWidth: "960px", margin: "0 auto", padding: "0.5rem 0 5rem" }}>

      {/* ── HERO ── */}
      <div style={{ textAlign: "center", width: "100%", paddingTop: "1rem" }}>
        {/* Logo */}
        <div style={{ marginBottom: "1.5rem" }}>
          <img src="/icon-192x192.png" alt="Savio Logo" style={{ width: "100px", height: "100px", borderRadius: "24px", boxShadow: "0 8px 32px rgba(139, 92, 246, 0.25)" }} />
        </div>
        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.9rem", borderRadius: "999px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", marginBottom: "1.5rem" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#8b5cf6", boxShadow: "0 0 6px #8b5cf6" }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8b5cf6", letterSpacing: "0.04em" }}>Savio - Tamamen Ücretsiz · Reklamsız</span>
        </div>

        <h1 style={{
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: "1.25rem",
          background: "none",
          WebkitTextFillColor: "unset",
          color: "white",
        }}>
          Savio{" "}
          <span style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            İndirici
          </span>
          {" "}&{" "}
          <span style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Araç Seti
          </span>
        </h1>

        <p style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", opacity: 0.6, maxWidth: "540px", margin: "0 auto 2rem", lineHeight: 1.7 }}>
          TikTok, Instagram, Pinterest ve Twitter'dan medya indir. QR oluştur, dosya paylaş, ses ve görsel dönüştür.
        </p>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: "clamp(1.5rem, 4vw, 3rem)", flexWrap: "wrap" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(1.2rem, 3vw, 1.6rem)", fontWeight: 800, color: "white" }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.45, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PLATFORM KARTLARI ── */}
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 700, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>Platform İndiriciler</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: "1rem" }}>
          {platforms.map((p, i) => (
            <Link key={i} href={p.href} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                style={{
                  position: "relative", overflow: "hidden",
                  borderRadius: "18px", padding: "1.5rem",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
                  cursor: "pointer", height: "100%",
                  display: "flex", flexDirection: "column", gap: "1rem",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.borderColor = p.accent;
                  e.currentTarget.style.boxShadow = `0 16px 40px ${p.shadow}`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Glow arka plan */}
                <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "120px", height: "120px", borderRadius: "50%", background: p.accent, opacity: 0.06, filter: "blur(30px)", pointerEvents: "none" }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {/* İkon */}
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "14px",
                    background: p.bg, display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 6px 20px ${p.shadow}`,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}>
                    {p.icon}
                  </div>
                  {p.badge && (
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "999px", background: "rgba(254,44,85,0.15)", color: "#fe2c55", border: "1px solid rgba(254,44,85,0.2)", letterSpacing: "0.03em" }}>
                      {p.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.3rem", color: "white" }}>{p.name}</h2>
                  <p style={{ fontSize: "0.8rem", opacity: 0.5, lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
                </div>

                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 600, color: p.accent }}>
                  <span>İndir</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── ARAÇLAR ── */}
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 700, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>Araçlar</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, 100%), 1fr))", gap: "0.75rem" }}>
          {tools.map((t, i) => (
            <Link key={i} href={t.href} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                style={{
                  borderRadius: "14px", padding: "1.1rem 1.1rem",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  transition: "transform 0.2s ease, background 0.2s ease, border-color 0.2s ease",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "0.9rem",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                }}
              >
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: t.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                  {t.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.85rem", margin: "0 0 0.15rem", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</p>
                  <p style={{ fontSize: "0.7rem", opacity: 0.4, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
