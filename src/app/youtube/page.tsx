"use client";

import { useState } from "react";
import Link from "next/link";

function extractVideoId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([^&#]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortsMatch = url.match(/shorts\/([^?&#]{11})/);
  if (shortsMatch) return shortsMatch[1];
  const shortUrlMatch = url.match(/youtu\.be\/([^?&#]{11})/);
  if (shortUrlMatch) return shortUrlMatch[1];
  return null;
}

/* ── YouTube İkonu ── */
function YTIcon({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

/* ── Dairesel İlerleme Çubuğu ── */
function CircularProgress({ progress, size = 80, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "1.25rem 0" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Arka plan halkası */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* İlerleme halkası */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FF0000"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: "stroke-dashoffset 0.35s ease",
              filter: "drop-shadow(0 0 6px rgba(255, 0, 0, 0.6))",
            }}
          />
        </svg>
        {/* Ortadaki Yüzde Göstergesi */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "1.15rem",
          color: "white",
          letterSpacing: "-0.02em",
        }}>
          %{Math.round(safeProgress)}
        </div>
      </div>
      <span style={{ fontSize: "0.85rem", opacity: 0.75, fontWeight: 500, color: "white" }}>
        {safeProgress >= 100 ? "Hazırlanıyor..." : "İşleniyor..."}
      </span>
    </div>
  );
}

export default function YouTubePage() {
  const [url, setUrl] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"mp4" | "mp3">("mp4");
  const [videoQuality, setVideoQuality] = useState("720");
  const [audioQuality, setAudioQuality] = useState("320");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const startConversion = async (targetFormat: "mp4" | "mp3", targetQuality: string, targetUrl: string) => {
    const renderApiUrl = process.env.NEXT_PUBLIC_YOUTUBE_API_URL || "https://mp3-apisi.onrender.com";
    const renderApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "sk-71c69f4de1f4b912957fed45";
    const videoId = extractVideoId(targetUrl);

    setLoading(true);
    setProgress(5);
    setError("");

    try {
      const convertRes = await fetch(`${renderApiUrl}/api/v1/convert?key=${encodeURIComponent(renderApiKey)}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-API-Key": renderApiKey
        },
        body: JSON.stringify({
          url: targetUrl,
          format: targetFormat,
          kalite: targetQuality,
          baslik: "YouTube",
          kaynak: "youtube"
        }),
      });

      const initData = await convertRes.json().catch(() => ({}));
      
      if (!convertRes.ok || !initData.ok) {
        throw new Error(initData.hata || initData.error || "İndirme başlatılamadı.");
      }

      setProgress(15);

      const statusUrlPath = initData.durum_url || `/api/v1/status/${initData.job_id}`;
      const statusFullUrl = `${renderApiUrl}${statusUrlPath}${statusUrlPath.includes("?") ? "&" : "?"}key=${encodeURIComponent(renderApiKey)}`;

      let isCompleted = false;
      let attempts = 0;
      while (!isCompleted && attempts < 45) {
        attempts++;
        await new Promise(r => setTimeout(r, 1200));
        
        const statusRes = await fetch(statusFullUrl, {
          headers: { "X-API-Key": renderApiKey }
        });
        const statusData = await statusRes.json().catch(() => ({}));
        
        if (statusData.durum === "hata" || statusData.durum === "failed") {
          throw new Error(statusData.hata || "İndirme sırasında bir hata oluştu.");
        }

        if (typeof statusData.yuzde === "number") {
          setProgress(Math.max(15, statusData.yuzde));
        } else {
          setProgress((prev) => Math.min(90, prev + 5));
        }
        
        if (statusData.durum === "bitti" && statusData.dosya_url) {
          isCompleted = true;
          setProgress(100);
          const finalFileUrl = `${renderApiUrl}${statusData.dosya_url}${statusData.dosya_url.includes("?") ? "&" : "?"}key=${encodeURIComponent(renderApiKey)}`;
          setResult({
            author: statusData.kanal || "YouTube",
            title: statusData.baslik || statusData.dosya || "YouTube İndirme",
            cover: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "",
            downloadUrl: finalFileUrl,
            format: targetFormat,
            quality: targetQuality,
            filename: statusData.dosya || `youtube_${targetFormat === "mp4" ? "video" : "audio"}.${targetFormat}`,
            rawData: statusData
          });
        }
      }

      if (!isCompleted) {
        throw new Error("İndirme zaman aşımına uğradı, lütfen tekrar deneyin.");
      }
    } catch (err: any) {
      setError(err.message || "İndirme başarısız oldu. Lütfen bağlantıyı kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setResult(null);
    const targetUrl = url.trim();
    const quality = selectedFormat === "mp4" ? videoQuality : audioQuality;
    await startConversion(selectedFormat, quality, targetUrl);
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
        {/* YouTube İkonu */}
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
          title="YouTube Uygulamasını/Web Sayfasını Aç"
        >
          <YTIcon size={38} />
        </div>
        <h1>YouTube İndirici</h1>
        <p className="subtitle">Videolar, Shorts ve MP3 müzikleri reklamsız ve yüksek kalitede indirin.</p>
      </div>

      {/* Form Paneli */}
      <div className="glass-panel" style={{ width: "100%", maxWidth: "650px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        {/* Format Seçim Sekmeleri */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", padding: "4px", borderRadius: "10px", gap: "4px" }}>
          <button
            type="button"
            onClick={() => setSelectedFormat("mp4")}
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "8px",
              border: "none",
              background: selectedFormat === "mp4" ? "#FF0000" : "transparent",
              color: "white",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Video (MP4)
          </button>
          <button
            type="button"
            onClick={() => setSelectedFormat("mp3")}
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "8px",
              border: "none",
              background: selectedFormat === "mp3" ? "#FF0000" : "transparent",
              color: "white",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Ses (MP3)
          </button>
        </div>

        {/* Kalite Seçenekleri */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", opacity: 0.7, fontWeight: 500 }}>
            {selectedFormat === "mp4" ? "Video Kalitesi:" : "Ses Kalitesi (Bitrate):"}
          </span>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {selectedFormat === "mp4" ? (
              [
                { label: "1080p", val: "1080" },
                { label: "720p HD", val: "720" },
                { label: "480p", val: "480" },
                { label: "360p", val: "360" },
              ].map((q) => (
                <button
                  key={q.val}
                  type="button"
                  onClick={() => setVideoQuality(q.val)}
                  style={{
                    padding: "0.3rem 0.65rem",
                    borderRadius: "6px",
                    border: videoQuality === q.val ? "1px solid #FF0000" : "1px solid rgba(255,255,255,0.1)",
                    background: videoQuality === q.val ? "rgba(255,0,0,0.2)" : "rgba(255,255,255,0.05)",
                    color: "white",
                    fontSize: "0.8rem",
                    fontWeight: videoQuality === q.val ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {q.label}
                </button>
              ))
            ) : (
              [
                { label: "320 kbps (En İyi)", val: "320" },
                { label: "192 kbps", val: "192" },
                { label: "128 kbps (Hızlı)", val: "128" },
              ].map((q) => (
                <button
                  key={q.val}
                  type="button"
                  onClick={() => setAudioQuality(q.val)}
                  style={{
                    padding: "0.3rem 0.65rem",
                    borderRadius: "6px",
                    border: audioQuality === q.val ? "1px solid #FF0000" : "1px solid rgba(255,255,255,0.1)",
                    background: audioQuality === q.val ? "rgba(255,0,0,0.2)" : "rgba(255,255,255,0.05)",
                    color: "white",
                    fontSize: "0.8rem",
                    fontWeight: audioQuality === q.val ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {q.label}
                </button>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleDownload} className="input-group">
          <input
            type="text"
            className="url-input"
            placeholder="YouTube video veya Shorts linkini buraya yapıştırın..."
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

        {/* Dairesel İlerleme Göstergesi */}
        {loading && (
          <CircularProgress progress={progress} />
        )}
      </div>

      {error && (
        <div className="glass-panel" style={{ width: "100%", maxWidth: "650px", border: "1px solid #ef4444", background: "rgba(239,68,68,0.1)", padding: "1rem 2rem" }}>
          <p style={{ color: "#ef4444", textAlign: "center", fontWeight: "600" }}>{error}</p>
        </div>
      )}

      {/* Sonuç Kartı */}
      {result && (
        <div className="glass-panel" style={{ width: "100%", maxWidth: "650px", display: "flex", flexDirection: "column", gap: "1.5rem", animation: "fadeIn 0.5s ease" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            {result.cover && (
              <img src={result.cover} alt="Video Kapak Resmi" style={{ width: "140px", borderRadius: "12px", objectFit: "cover", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }} />
            )}
            <div style={{ flex: 1, minWidth: "250px" }}>
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1.2rem" }}>{result.author || "YouTube İçerik Üreticisi"}</h3>
              <p style={{ opacity: 0.8, fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: "1.4" }}>{result.title}</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {/* Ana İndirme Butonu */}
                {result.downloadUrl && (
                  <a href={result.downloadUrl} target="_blank" rel="noopener noreferrer" download={result.filename} className="btn" style={{ textDecoration: "none" }}>
                    {result.format === "mp4" ? `Videoyu İndir (MP4 - ${result.quality}p)` : `Sesi İndir (MP3 - ${result.quality} kbps)`}
                  </a>
                )}

                {/* Hızlı Alternatif Format Butonları */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                  {result.format === "mp4" ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => startConversion("mp3", "320", url.trim())}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: "0.85rem", padding: "0.6rem 1rem" }}
                    >
                      MP3 Olarak İndir (320 kbps)
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => startConversion("mp4", "720", url.trim())}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: "0.85rem", padding: "0.6rem 1rem" }}
                    >
                      MP4 Video Olarak İndir (720p HD)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nasıl Kullanılır */}
      <div className="glass-panel" style={{ width: "100%", marginTop: "2rem", marginBottom: "4rem" }}>
        <h2 style={{ textAlign: "center", marginBottom: "2rem", fontSize: "1.5rem" }}>Nasıl Kullanılır?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", textAlign: "center" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(255,0,0,0.4))" }}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Bir video bulun</h3>
            <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>YouTube uygulamasında veya web sitesinde indirmek istediğiniz videoyu veya Shorts&apos;u açın.</p>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(255,0,0,0.4))" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Linki kopyalayın</h3>
            <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>&quot;Paylaş&quot; butonuna dokunun ve &quot;Bağlantıyı Kopyala&quot;yı seçin.</p>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(255,0,0,0.4))" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Formatı seçip İndirin</h3>
            <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>Video (MP4) veya Ses (MP3) ve kaliteyi seçin, linki yapıştırıp İndir&apos;e tıklayın.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
