"use client";

import { useState } from "react";

export default function Home() {
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
      const res = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", alignItems: "center" }}>
      
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <h1>TikTok İndirici</h1>
        <p className="subtitle">Filigransız ve tamamen reklamsız video & ses indirin.</p>
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
        <div className="glass-panel" style={{ width: "100%", maxWidth: "650px", border: "1px solid #ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "1rem 2rem" }}>
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
                        <div key={idx} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
            <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>"Paylaş" butonuna dokunun ve "Bağlantıyı Kopyala"yı seçin.</p>
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
