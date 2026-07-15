"use client";

import Link from "next/link";

/* ── Platform İkonları ── */
function TIcon({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z" />
    </svg>
  );
}

function IIcon({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function PIcon({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

function XIcon({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YTIcon({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function Home() {
  const cards = [
    {
      name: "TikTok",
      desc: "Filigransız video, kaydırmalı fotoğraf slaytları ve MP3 indirme",
      href: "/tiktok",
      color: "#000000",
      border: "1.5px solid rgba(255,255,255,0.15)",
      shadow: "rgba(254,44,85,0.3)",
      glow: "#fe2c55",
      icon: <TIcon size={34} />
    },
    {
      name: "Instagram",
      desc: "Reels videoları, tekil ve çoklu fotoğraf gönderileri indirme",
      href: "/instagram",
      color: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
      border: "none",
      shadow: "rgba(220,39,67,0.3)",
      glow: "#e1306c",
      icon: <IIcon size={32} />
    },
    {
      name: "Pinterest",
      desc: "Tekil Pin indirme, profil pinlerini listeleme ve toplu indirme",
      href: "/pinterest",
      color: "#E60023",
      border: "none",
      shadow: "rgba(230,0,35,0.3)",
      glow: "#E60023",
      icon: <PIcon size={34} />
    },
    {
      name: "Twitter/X",
      desc: "Tweet'lerdeki yüksek çözünürlüklü videoları ve GIF'leri indirme",
      href: "/twitter",
      color: "#000000",
      border: "1.5px solid rgba(255,255,255,0.15)",
      shadow: "rgba(29,161,242,0.3)",
      glow: "#1DA1F2",
      icon: <XIcon size={32} />
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem", alignItems: "center", width: "100%", maxWidth: "900px", margin: "0 auto", padding: "1rem 0 5rem" }}>
      
      {/* ── Karşılama Başlığı ── */}
      <div style={{ textAlign: "center", marginTop: "0.5rem", width: "100%" }}>
        <h1 style={{
          fontSize: "clamp(1.6rem, 5vw, 2.8rem)",
          fontWeight: 800,
          background: "linear-gradient(to right, #ffffff, rgba(255,255,255,0.7))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.75rem",
          letterSpacing: "-0.02em"
        }}>
          Evrensel Sosyal Medya İndirici
        </h1>
        <p className="subtitle" style={{ fontSize: "clamp(0.88rem, 2.5vw, 1.05rem)", opacity: 0.75, maxWidth: "600px", margin: "0 auto" }}>
          TikTok, Instagram ve Pinterest medyalarını yüksek kalitede, tamamen reklamsız ve doğrudan indirin.
        </p>
      </div>

      {/* ── Platform Kartları ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
        gap: "1.25rem",
        width: "100%",
        perspective: "1000px"
      }}>
        {cards.map((card, idx) => (
          <Link
            key={idx}
            href={card.href}
            style={{ textDecoration: "none", color: "inherit", display: "flex" }}
          >
            <div
              className="glass-panel"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                padding: "2rem 1.5rem",
                width: "100%",
                borderRadius: "20px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.borderColor = card.glow;
                e.currentTarget.style.boxShadow = `0 12px 35px ${card.shadow}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Platform İkon Yuvarlağı */}
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "16px",
                background: card.color,
                border: card.border,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 8px 24px ${card.shadow}`,
              }}>
                {card.icon}
              </div>

              {/* Detaylar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>
                  {card.name} İndirici
                </h2>
                <p style={{ fontSize: "0.88rem", opacity: 0.65, lineHeight: "1.5", margin: 0 }}>
                  {card.desc}
                </p>
              </div>

              {/* Alt Bilgi */}
              <div style={{
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: card.glow,
                opacity: 0.85
              }}>
                <span>Hemen İndir</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
