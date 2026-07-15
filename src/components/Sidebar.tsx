"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ── Platform İkonları ── */
function TIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z" />
    </svg>
  );
}

function IIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function PIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YTIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function Sidebar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPage, setMenuPage] = useState(1); // 1. sayfa veya 2. sayfa
  const pathname = usePathname();

  // Menü öğeleri listesi (TikTok ilk sırada)
  const menuItems = [
    {
      name: "TikTok İndirici",
      desc: "Filigransız video ve MP3",
      href: "/tiktok",
      color: "#000000",
      border: "1px solid rgba(255,255,255,0.15)",
      shadow: "rgba(254,44,85,0.25)",
      icon: <TIcon size={20} />
    },
    {
      name: "Instagram İndirici",
      desc: "Reels ve fotoğraflar",
      href: "/instagram",
      color: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
      border: "none",
      shadow: "rgba(220,39,67,0.25)",
      icon: <IIcon size={20} />
    },
    {
      name: "Pinterest İndirici",
      desc: "Video ve fotoğraf pinleri",
      href: "/pinterest",
      color: "#E60023",
      border: "none",
      shadow: "rgba(230,0,35,0.25)",
      icon: <PIcon size={20} />
    },
    {
      name: "Twitter/X İndirici",
      desc: "Tweet video ve GIF'leri",
      href: "/twitter",
      color: "#000000",
      border: "1px solid rgba(255,255,255,0.15)",
      shadow: "rgba(29,161,242,0.25)",
      icon: <XIcon size={18} />
    }
  ];

  return (
    <>
      {/* Hamburger Aç Butonu */}
      <button
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
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </button>

      {/* Karartma Overlay */}
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

      {/* Sol Sidebar Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "min(300px, 85vw)",
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
          overflowY: "auto",
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
          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "white", letterSpacing: "0.03em" }}>
            Tüm İndiriciler
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

        {/* ── Kullanıcı İsteği: Sekme Seçimi (Tüm İndirici Yazısının Altı) ── */}
        <div style={{
          display: "flex",
          gap: "0.35rem",
          padding: "0.6rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.01)"
        }}>
          <button
            onClick={() => setMenuPage(1)}
            style={{
              flex: 1,
              padding: "0.55rem",
              borderRadius: "8px",
              border: "none",
              background: menuPage === 1 ? "rgba(255,255,255,0.08)" : "transparent",
              color: menuPage === 1 ? "white" : "rgba(255,255,255,0.45)",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Platformlar
          </button>
          <button
            onClick={() => setMenuPage(2)}
            style={{
              flex: 1,
              padding: "0.55rem",
              borderRadius: "8px",
              border: "none",
              background: menuPage === 2 ? "rgba(255,255,255,0.08)" : "transparent",
              color: menuPage === 2 ? "white" : "rgba(255,255,255,0.45)",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Daha Fazlası
          </button>
        </div>

        {/* ── Nav Slider (Yatay Sayfa Geçişli Alan) ── */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div style={{
            display: "flex",
            width: "200%",
            height: "100%",
            transform: menuPage === 1 ? "translateX(0)" : "translateX(-50%)",
            transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
          }}>
            
            {/* Sayfa 1: Platform İndiriciler */}
            <nav style={{
              width: "50%",
              padding: "1.25rem 0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              boxSizing: "border-box"
            }}>
              {menuItems.map((item, idx) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      textDecoration: "none",
                      color: "white",
                      background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                      border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                      transition: "background 0.2s ease, border-color 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Platform İkon Yuvarlağı */}
                    <div style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: item.color,
                      border: item.border,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: `0 4px 12px ${item.shadow}`,
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>{item.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>{item.desc}</div>
                    </div>
                    {/* Ok ikonu */}
                    <svg style={{ marginLeft: "auto", opacity: 0.35 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                );
              })}
            </nav>

            {/* Sayfa 2: Araçlar */}
            <nav style={{
              width: "50%",
              padding: "1.25rem 0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              boxSizing: "border-box"
            }}>
              {/* Görsel Dönüştürücü */}
              {(() => {
                const isActive = pathname === "/image-converter";
                return (
                  <Link
                    href="/image-converter"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      textDecoration: "none",
                      color: "white",
                      background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                      border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>Görsel Dönüştürücü</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>JPG, PNG, WebP, AVIF</div>
                    </div>
                    <svg style={{ marginLeft: "auto", opacity: 0.35 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                );
              })()}

              {/* Renk Paleti */}
              {(() => {
                const isActive = pathname === "/color-picker";
                return (
                  <Link
                    href="/color-picker"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: "1rem",
                      padding: "0.85rem 1rem", borderRadius: "10px",
                      textDecoration: "none", color: "white",
                      background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                      border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
                      background: "linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/><circle cx="6" cy="14" r="2.5"/><circle cx="10.5" cy="19.5" r="2.5"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>Renk Paleti</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>HEX, RGB, HSL dönüştür</div>
                    </div>
                    <svg style={{ marginLeft: "auto", opacity: 0.35 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                );
              })()}

              {/* QR Kod */}
              {(() => {
                const isActive = pathname === "/qr-code";
                return (
                  <Link
                    href="/qr-code"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: "1rem",
                      padding: "0.85rem 1rem", borderRadius: "10px",
                      textDecoration: "none", color: "white",
                      background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                      border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
                      background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                        <path d="M14 14h2v2h-2z"/><path d="M18 14h3v2h-3z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>QR Kod Oluşturucu</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>URL, WiFi, e-posta, metin</div>
                    </div>
                    <svg style={{ marginLeft: "auto", opacity: 0.35 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                );
              })()}

              {/* Ses Dönüştürücü */}
              {(() => {
                const isActive = pathname === "/audio-converter";
                return (
                  <Link
                    href="/audio-converter"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: "1rem",
                      padding: "0.85rem 1rem", borderRadius: "10px",
                      textDecoration: "none", color: "white",
                      background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                      border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0, background: "linear-gradient(135deg, #f59e0b, #ef4444)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>Ses Dönüştürücü</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>MP3, WAV, OGG, AAC, FLAC</div>
                    </div>
                    <svg style={{ marginLeft: "auto", opacity: 0.35 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>
                );
              })()}

              {/* AI Playlist */}
              {(() => {
                const isActive = pathname === "/playlist";
                return (
                  <Link
                    href="/playlist"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: "1rem",
                      padding: "0.85rem 1rem", borderRadius: "10px",
                      textDecoration: "none", color: "white",
                      background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                      border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0, background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(139,92,246,0.3)" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 9l12-2"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>AI Playlist</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>Duygu bazlı müzik listesi</div>
                    </div>
                    <svg style={{ marginLeft: "auto", opacity: 0.35 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>
                );
              })()}

              {/* Yakında */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.07)", opacity: 0.4, marginTop: "0.25rem" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>Yakında...</div>
                  <div style={{ fontSize: "0.73rem", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Yeni araçlar eklenecek</div>
                </div>
              </div>
            </nav>

          </div>
        </div>
      </div>
    </>
  );
}
