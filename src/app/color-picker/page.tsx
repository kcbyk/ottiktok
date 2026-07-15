"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

/* ── Renk Dönüşüm Fonksiyonları ── */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 3 && clean.length !== 6) return null;
  const full = clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean;
  const num = parseInt(full, 16);
  if (isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const sn = s / 100, ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function getContrastColor(r: number, g: number, b: number): string {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

function generateShades(r: number, g: number, b: number): Array<{ hex: string; label: string }> {
  const { h, s } = rgbToHsl(r, g, b);
  const lightnesses = [95, 85, 70, 55, 40, 30, 20, 10];
  return lightnesses.map((l, i) => {
    const rgb = hslToRgb(h, Math.max(s - 5, 5), l);
    return { hex: rgbToHex(rgb.r, rgb.g, rgb.b), label: (i + 1) * 100 + "" };
  });
}

function generateHarmonies(h: number, s: number, l: number) {
  const mkRgb = (hue: number) => {
    const rgb = hslToRgb(((hue % 360) + 360) % 360, s, l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  };
  return {
    complementary: [mkRgb(h + 180)],
    triadic: [mkRgb(h + 120), mkRgb(h + 240)],
    analogous: [mkRgb(h - 30), mkRgb(h + 30)],
    split: [mkRgb(h + 150), mkRgb(h + 210)],
  };
}

/* ── Copy Toast ── */
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);
  return { copied, copy };
}

/* ── Renk Chip Bileşeni ── */
function ColorChip({ hex, label, size = "md" }: { hex: string; label?: string; size?: "sm" | "md" | "lg" }) {
  const { copied, copy } = useCopy();
  const rgb = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
  const fg = getContrastColor(rgb.r, rgb.g, rgb.b);
  const isCopied = copied === hex;
  const h = size === "lg" ? 80 : size === "md" ? 56 : 40;

  return (
    <div
      onClick={() => copy(hex)}
      title={`${hex} — kopyalamak için tıkla`}
      style={{
        background: hex,
        height: `${h}px`,
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: "relative",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        userSelect: "none",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"; }}
    >
      {label && <span style={{ fontSize: "0.68rem", fontWeight: 700, color: fg, opacity: 0.7 }}>{label}</span>}
      <span style={{ fontSize: size === "sm" ? "0.62rem" : "0.7rem", fontWeight: 600, color: fg }}>
        {isCopied ? "✓ Kopyalandı" : hex.toUpperCase()}
      </span>
    </div>
  );
}

export default function ColorPickerPage() {
  const [hex, setHex] = useState("#6366f1");
  const [hexInput, setHexInput] = useState("#6366f1");
  const [rgbInput, setRgbInput] = useState({ r: "99", g: "102", b: "241" });
  const [hslInput, setHslInput] = useState({ h: "239", s: "84", l: "67" });
  const [activeInput, setActiveInput] = useState<"hex" | "rgb" | "hsl" | "picker">("picker");
  const { copy, copied } = useCopy();

  const rgb = hexToRgb(hex) || { r: 99, g: 102, b: 241 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const shades = generateShades(rgb.r, rgb.g, rgb.b);
  const harmonies = generateHarmonies(hsl.h, hsl.s, hsl.l);

  // Renk değişince tüm inputları güncelle
  useEffect(() => {
    if (activeInput === "picker" || activeInput === "rgb" || activeInput === "hsl") {
      setHexInput(hex);
    }
    const r = hexToRgb(hex);
    if (r) {
      if (activeInput !== "rgb") setRgbInput({ r: r.r.toString(), g: r.g.toString(), b: r.b.toString() });
      const h2 = rgbToHsl(r.r, r.g, r.b);
      if (activeInput !== "hsl") setHslInput({ h: h2.h.toString(), s: h2.s.toString(), l: h2.l.toString() });
    }
  }, [hex]);

  const handleHexInput = (val: string) => {
    setHexInput(val);
    setActiveInput("hex");
    const clean = val.startsWith("#") ? val : "#" + val;
    if (/^#[0-9A-Fa-f]{6}$/.test(clean) || /^#[0-9A-Fa-f]{3}$/.test(clean)) {
      setHex(clean);
    }
  };

  const handleRgbInput = (field: "r" | "g" | "b", val: string) => {
    const newRgb = { ...rgbInput, [field]: val };
    setRgbInput(newRgb);
    setActiveInput("rgb");
    const r = parseInt(newRgb.r), g = parseInt(newRgb.g), b = parseInt(newRgb.b);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b) && r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      setHex(rgbToHex(r, g, b));
    }
  };

  const handleHslInput = (field: "h" | "s" | "l", val: string) => {
    const newHsl = { ...hslInput, [field]: val };
    setHslInput(newHsl);
    setActiveInput("hsl");
    const h = parseInt(newHsl.h), s = parseInt(newHsl.s), l = parseInt(newHsl.l);
    if (!isNaN(h) && !isNaN(s) && !isNaN(l) && h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
      const r2 = hslToRgb(h, s, l);
      setHex(rgbToHex(r2.r, r2.g, r2.b));
    }
  };

  const fg = getContrastColor(rgb.r, rgb.g, rgb.b);
  const cssRgb = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const cssHsl = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    color: "white",
    padding: "0.55rem 0.75rem",
    fontSize: "0.9rem",
    outline: "none",
    width: "100%",
    fontFamily: "monospace",
  } as React.CSSProperties;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", alignItems: "center", maxWidth: "700px", margin: "0 auto", padding: "2rem 1rem 5rem" }}>

      {/* Geri */}
      <div style={{ width: "100%", marginTop: "0.5rem" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.9rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Ana Sayfaya Dön
        </Link>
      </div>

      {/* Başlık */}
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "70px", height: "70px", borderRadius: "18px", background: "linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", boxShadow: "0 8px 30px rgba(139,92,246,0.35)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/><circle cx="6" cy="14" r="2.5"/><circle cx="10.5" cy="19.5" r="2.5"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, background: "linear-gradient(135deg, #f59e0b, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.5rem" }}>
          Renk Paleti
        </h1>
        <p className="subtitle" style={{ margin: 0 }}>HEX, RGB, HSL dönüştür — tıkla, kopyala.</p>
      </div>

      {/* Ana Renk Seçici */}
      <div className="glass-panel" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Büyük Renk Önizleme + Native Picker */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "stretch", flexWrap: "wrap" }}>
          <div
            style={{ flex: 1, minWidth: "160px", height: "100px", borderRadius: "14px", background: hex, boxShadow: `0 8px 32px ${hex}55`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
          >
            <span style={{ color: fg, fontWeight: 700, fontSize: "1.1rem", fontFamily: "monospace" }}>{hex.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", justifyContent: "center" }}>
            <label style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "0.2rem" }}>Renk Seçici</label>
            <input
              type="color"
              value={hex.length === 7 ? hex : "#6366f1"}
              onChange={e => { setActiveInput("picker"); setHex(e.target.value); }}
              style={{ width: "70px", height: "50px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", background: "none", padding: "2px" }}
            />
          </div>
        </div>

        {/* HEX Input */}
        <div>
          <label style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.4rem" }}>HEX</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              style={inputStyle}
              value={hexInput}
              onChange={e => handleHexInput(e.target.value)}
              placeholder="#6366f1"
              maxLength={7}
            />
            <button onClick={() => copy(hex)} className="btn btn-secondary" style={{ padding: "0.55rem 1rem", fontSize: "0.85rem", whiteSpace: "nowrap", flexShrink: 0 }}>
              {copied === hex ? "✓" : "Kopyala"}
            </button>
          </div>
        </div>

        {/* RGB Input */}
        <div>
          <label style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.4rem" }}>RGB</label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {(["r", "g", "b"] as const).map((ch, i) => (
              <div key={ch} style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", fontWeight: 700, color: ["#f87171","#4ade80","#60a5fa"][i], opacity: 0.8 }}>{ch.toUpperCase()}</span>
                <input
                  style={{ ...inputStyle, paddingLeft: "1.6rem" }}
                  value={rgbInput[ch]}
                  onChange={e => handleRgbInput(ch, e.target.value)}
                  type="number" min={0} max={255}
                />
              </div>
            ))}
            <button onClick={() => copy(cssRgb)} className="btn btn-secondary" style={{ padding: "0.55rem 0.75rem", fontSize: "0.85rem", flexShrink: 0 }}>
              {copied === cssRgb ? "✓" : "Kopyala"}
            </button>
          </div>
        </div>

        {/* HSL Input */}
        <div>
          <label style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.4rem" }}>HSL</label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {([["h","H°",360],["s","S%",100],["l","L%",100]] as const).map(([ch, label, max]) => (
              <div key={ch} style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", fontWeight: 700, opacity: 0.6 }}>{label}</span>
                <input
                  style={{ ...inputStyle, paddingLeft: "2rem" }}
                  value={hslInput[ch as "h"|"s"|"l"]}
                  onChange={e => handleHslInput(ch as "h"|"s"|"l", e.target.value)}
                  type="number" min={0} max={max}
                />
              </div>
            ))}
            <button onClick={() => copy(cssHsl)} className="btn btn-secondary" style={{ padding: "0.55rem 0.75rem", fontSize: "0.85rem", flexShrink: 0 }}>
              {copied === cssHsl ? "✓" : "Kopyala"}
            </button>
          </div>
        </div>
      </div>

      {/* Tonlar (Shades) */}
      <div className="glass-panel" style={{ width: "100%" }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Tonlar — tıkla &amp; kopyala</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "0.4rem" }}>
          {shades.map(shade => (
            <ColorChip key={shade.label} hex={shade.hex} label={shade.label} size="md" />
          ))}
        </div>
      </div>

      {/* Renk Uyumları */}
      <div className="glass-panel" style={{ width: "100%" }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>Renk Uyumları</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { label: "Tamamlayıcı", colors: harmonies.complementary },
            { label: "Üçlü", colors: harmonies.triadic },
            { label: "Analog", colors: harmonies.analogous },
            { label: "Ayrık Tamamlayıcı", colors: harmonies.split },
          ].map(group => (
            <div key={group.label}>
              <p style={{ fontSize: "0.75rem", opacity: 0.5, marginBottom: "0.4rem" }}>{group.label}</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <ColorChip hex={hex} size="sm" />
                {group.colors.map(c => <ColorChip key={c} hex={c} size="sm" />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS Çıktısı */}
      <div className="glass-panel" style={{ width: "100%" }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>CSS Değerleri</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { label: "HEX", value: hex.toUpperCase() },
            { label: "RGB", value: cssRgb },
            { label: "HSL", value: cssHsl },
            { label: "CSS Variable", value: `--color-primary: ${hex.toUpperCase()};` },
            { label: "Tailwind (yaklaşık)", value: `bg-[${hex.toUpperCase()}]` },
          ].map(item => (
            <div
              key={item.label}
              onClick={() => copy(item.value)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.6rem 0.85rem", borderRadius: "8px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer", transition: "background 0.15s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            >
              <span style={{ fontSize: "0.75rem", opacity: 0.5, minWidth: "120px" }}>{item.label}</span>
              <code style={{ fontSize: "0.82rem", fontFamily: "monospace", flex: 1 }}>{item.value}</code>
              <span style={{ fontSize: "0.75rem", opacity: copied === item.value ? 1 : 0.4, color: copied === item.value ? "#4ade80" : "white", marginLeft: "0.75rem" }}>
                {copied === item.value ? "✓ Kopyalandı" : "Kopyala"}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
