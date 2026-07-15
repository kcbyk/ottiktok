"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

type QRType = "url" | "text" | "wifi" | "email" | "phone";

interface WiFiConfig {
  ssid: string;
  password: string;
  security: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

interface EmailConfig {
  to: string;
  subject: string;
  body: string;
}

const TYPE_INFO: Record<QRType, { label: string; placeholder: string }> = {
  url:   { label: "URL",      placeholder: "https://example.com" },
  text:  { label: "Metin",    placeholder: "Herhangi bir metin..." },
  wifi:  { label: "WiFi",     placeholder: "" },
  email: { label: "E-posta",  placeholder: "ornek@email.com" },
  phone: { label: "Telefon",  placeholder: "+90 555 123 4567" },
};

function buildQRContent(type: QRType, text: string, wifi: WiFiConfig, email: EmailConfig): string {
  switch (type) {
    case "url":   return text.startsWith("http") ? text : "https://" + text;
    case "text":  return text;
    case "phone": return "tel:" + text.replace(/\s/g, "");
    case "email":
      let mailto = "mailto:" + email.to;
      const params = [];
      if (email.subject) params.push("subject=" + encodeURIComponent(email.subject));
      if (email.body)    params.push("body=" + encodeURIComponent(email.body));
      if (params.length) mailto += "?" + params.join("&");
      return mailto;
    case "wifi":
      const esc = (s: string) => s.replace(/[\\;,"]/g, c => "\\" + c);
      return `WIFI:T:${wifi.security};S:${esc(wifi.ssid)};P:${esc(wifi.password)};H:${wifi.hidden ? "true" : "false"};;`;
    default: return text;
  }
}

export default function QRCodePage() {
  const [type, setType]       = useState<QRType>("url");
  const [text, setText]       = useState("https://");
  const [wifi, setWifi]       = useState<WiFiConfig>({ ssid: "", password: "", security: "WPA", hidden: false });
  const [email, setEmail]     = useState<EmailConfig>({ to: "", subject: "", body: "" });
  const [fgColor, setFgColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#000000");
  const [size, setSize]       = useState(300);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [qrDataUrl, setQrDataUrl]   = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateQR = useCallback(async () => {
    const content = buildQRContent(type, text, wifi, email);
    if (!content.trim() || content === "https://") return;

    setGenerating(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const dataUrl = await QRCode.toDataURL(content, {
        width: size,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("QR oluşturma hatası:", err);
    } finally {
      setGenerating(false);
    }
  }, [type, text, wifi, email, fgColor, bgColor, size, errorLevel]);

  // Debounce ile otomatik üret
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(generateQR, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [generateQR]);

  const handleDownload = (fmt: "png" | "svg") => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    if (fmt === "png") {
      a.href = qrDataUrl;
      a.download = "qrcode.png";
    } else {
      // SVG olarak export
      const content = buildQRContent(type, text, wifi, email);
      import("qrcode").then(mod => {
        mod.default.toString(content, {
          type: "svg",
          margin: 2,
          color: { dark: fgColor, light: bgColor },
          errorCorrectionLevel: errorLevel,
        }).then(svg => {
          const blob = new Blob([svg], { type: "image/svg+xml" });
          a.href = URL.createObjectURL(blob);
          a.download = "qrcode.svg";
          a.click();
        });
      });
      return;
    }
    a.click();
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
        <div style={{ width: "70px", height: "70px", borderRadius: "18px", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", boxShadow: "0 8px 30px rgba(14,165,233,0.35)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <path d="M14 14h2v2h-2z"/><path d="M18 14h3v2h-3z"/><path d="M14 18h2v3h-2z"/><path d="M18 18h3v3h-3z"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, background: "linear-gradient(135deg, #0ea5e9, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.5rem" }}>
          QR Kod Oluşturucu
        </h1>
        <p className="subtitle" style={{ margin: 0 }}>URL, WiFi, metin ve daha fazlası — anında QR üret.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", width: "100%" }} className="qr-grid">

        {/* Sol: Ayarlar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Tip Seçimi */}
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>İçerik Tipi</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {(Object.keys(TYPE_INFO) as QRType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "0.55rem 0.75rem", borderRadius: "8px",
                    border: type === t ? "1.5px solid #0ea5e9" : "1.5px solid transparent",
                    background: type === t ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.03)",
                    color: type === t ? "#0ea5e9" : "rgba(255,255,255,0.6)",
                    cursor: "pointer", fontSize: "0.88rem", fontWeight: 600,
                    transition: "all 0.15s ease", textAlign: "left",
                  }}
                >
                  <span>{TYPE_INFO[t].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* İçerik Girişi */}
          <div className="glass-panel" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>İçerik</p>

            {(type === "url" || type === "text" || type === "phone") && (
              <input
                style={inputStyle}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={TYPE_INFO[type].placeholder}
              />
            )}

            {type === "wifi" && (
              <>
                <input style={inputStyle} value={wifi.ssid} onChange={e => setWifi(w => ({ ...w, ssid: e.target.value }))} placeholder="WiFi Ağ Adı (SSID)" />
                <input style={inputStyle} type="password" value={wifi.password} onChange={e => setWifi(w => ({ ...w, password: e.target.value }))} placeholder="WiFi Şifresi" />
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={wifi.security}
                  onChange={e => setWifi(w => ({ ...w, security: e.target.value as "WPA" | "WEP" | "nopass" }))}
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Şifresiz</option>
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={wifi.hidden} onChange={e => setWifi(w => ({ ...w, hidden: e.target.checked }))} style={{ accentColor: "#0ea5e9" }} />
                  Gizli ağ
                </label>
              </>
            )}

            {type === "email" && (
              <>
                <input style={inputStyle} value={email.to} onChange={e => setEmail(em => ({ ...em, to: e.target.value }))} placeholder="ornek@email.com" />
                <input style={inputStyle} value={email.subject} onChange={e => setEmail(em => ({ ...em, subject: e.target.value }))} placeholder="Konu (isteğe bağlı)" />
                <textarea
                  style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }}
                  value={email.body}
                  onChange={e => setEmail(em => ({ ...em, body: e.target.value }))}
                  placeholder="Mesaj (isteğe bağlı)"
                />
              </>
            )}
          </div>

          {/* Tasarım Ayarları */}
          <div className="glass-panel" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tasarım</p>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.75rem", opacity: 0.5, display: "block", marginBottom: "0.3rem" }}>QR Rengi</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} style={{ width: "40px", height: "36px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", background: "none", padding: "2px" }} />
                  <span style={{ fontSize: "0.8rem", fontFamily: "monospace", opacity: 0.7 }}>{fgColor.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.75rem", opacity: 0.5, display: "block", marginBottom: "0.3rem" }}>Arka Plan</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: "40px", height: "36px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", background: "none", padding: "2px" }} />
                  <span style={{ fontSize: "0.8rem", fontFamily: "monospace", opacity: 0.7 }}>{bgColor.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <label style={{ fontSize: "0.75rem", opacity: 0.5 }}>Boyut</label>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.7 }}>{size}px</span>
              </div>
              <input type="range" min={128} max={512} step={32} value={size} onChange={e => setSize(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#0ea5e9", cursor: "pointer" }} />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", opacity: 0.5, display: "block", marginBottom: "0.3rem" }}>Hata Düzeltme</label>
              <div style={{ display: "flex", gap: "0.3rem" }}>
                {(["L","M","Q","H"] as const).map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setErrorLevel(lvl)}
                    style={{
                      flex: 1, padding: "0.4rem", borderRadius: "6px",
                      border: errorLevel === lvl ? "1.5px solid #0ea5e9" : "1.5px solid rgba(255,255,255,0.08)",
                      background: errorLevel === lvl ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.03)",
                      color: errorLevel === lvl ? "#0ea5e9" : "rgba(255,255,255,0.5)",
                      cursor: "pointer", fontSize: "0.82rem", fontWeight: 700,
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: "0.7rem", opacity: 0.35, marginTop: "0.3rem" }}>L=7% · M=15% · Q=25% · H=30% kurtarma</p>
            </div>
          </div>
        </div>

        {/* Sağ: QR Önizleme */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em", alignSelf: "flex-start" }}>Önizleme</p>

            <div style={{ width: "100%", aspectRatio: "1", borderRadius: "12px", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
              {generating ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={fgColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", opacity: 0.5 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Kod" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <div style={{ textAlign: "center", opacity: 0.3 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>İçerik gir</p>
                </div>
              )}
            </div>

            {/* İndir Butonları */}
            {qrDataUrl && (
              <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                <button onClick={() => handleDownload("png")} className="btn" style={{ flex: 1, background: "linear-gradient(135deg, #0ea5e9, #6366f1)", fontSize: "0.88rem", padding: "0.7rem" }}>
                  PNG İndir
                </button>
                <button onClick={() => handleDownload("svg")} className="btn btn-secondary" style={{ flex: 1, fontSize: "0.88rem", padding: "0.7rem" }}>
                  SVG İndir
                </button>
              </div>
            )}
          </div>

          {/* Hazır Şablonlar */}
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Hızlı Şablonlar</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {[
                { label: "Bu site",       action: () => { setType("url"); setText("https://"); } },
                { label: "WiFi paylaş",   action: () => setType("wifi") },
                { label: "E-posta gönder",action: () => setType("email") },
                { label: "Beni ara",      action: () => { setType("phone"); setText(""); } },
              ].map(tmpl => (
                <button
                  key={tmpl.label}
                  onClick={tmpl.action}
                  style={{
                    display: "flex", alignItems: "center",
                    padding: "0.5rem 0.6rem", borderRadius: "7px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.03)",
                    color: "rgba(255,255,255,0.65)",
                    cursor: "pointer", fontSize: "0.82rem",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select option { background: #111; color: white; }
        @media (min-width: 640px) {
          .qr-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
