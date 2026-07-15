"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

type AudioFormat = "mp3" | "wav" | "ogg" | "aac" | "flac";

const FORMAT_INFO: Record<AudioFormat, { label: string; mime: string; desc: string; color: string }> = {
  mp3:  { label: "MP3",  mime: "audio/mpeg",   desc: "Evrensel uyumluluk",  color: "#f59e0b" },
  wav:  { label: "WAV",  mime: "audio/wav",    desc: "Kayıpsız kalite",     color: "#60a5fa" },
  ogg:  { label: "OGG",  mime: "audio/ogg",    desc: "Açık format",         color: "#4ade80" },
  aac:  { label: "AAC",  mime: "audio/aac",    desc: "Yüksek verimlilik",   color: "#a78bfa" },
  flac: { label: "FLAC", mime: "audio/flac",   desc: "Tam kayıpsız",        color: "#f87171" },
};

function formatBytes(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(2) + " MB";
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioConverterPage() {
  const [file, setFile]             = useState<File | null>(null);
  const [format, setFormat]         = useState<AudioFormat>("mp3");
  const [bitrate, setBitrate]       = useState("192");
  const [status, setStatus]         = useState<"idle" | "loading" | "ready" | "converting" | "done" | "error">("idle");
  const [progress, setProgress]     = useState(0);
  const [outputUrl, setOutputUrl]   = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [duration, setDuration]     = useState<number | null>(null);
  const [errorMsg, setErrorMsg]     = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const ffmpegRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return;
    setStatus("loading");
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      ffmpegRef.current = ffmpeg;
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setErrorMsg("FFmpeg yüklenemedi. İnternet bağlantınızı kontrol edin.");
    }
  }, []);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("audio/") && !f.type.startsWith("video/")) {
      setErrorMsg("Lütfen bir ses veya video dosyası seçin.");
      return;
    }
    if (f.size > 200 * 1024 * 1024) {
      setErrorMsg("Dosya çok büyük. Maksimum 200MB.");
      return;
    }
    setErrorMsg("");
    setOutputUrl(null);
    setOutputSize(null);
    setFile(f);

    // Süreyi audio element ile oku
    const url = URL.createObjectURL(f);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      URL.revokeObjectURL(url);
    };

    if (status === "idle") loadFFmpeg();
  }, [status, loadFFmpeg]);

  const handleConvert = async () => {
    if (!file || !ffmpegRef.current) return;
    setStatus("converting");
    setProgress(0);
    setErrorMsg("");
    setOutputUrl(null);

    try {
      const { fetchFile } = await import("@ffmpeg/util");
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on("progress", ({ progress: p }: { progress: number }) => {
        setProgress(Math.round(p * 100));
      });

      const inputExt = file.name.split(".").pop() || "mp4";
      const inputName = `input.${inputExt}`;
      const outputName = `output.${format}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const args: string[] = ["-i", inputName];

      if (format === "mp3") {
        args.push("-c:a", "libmp3lame", "-b:a", `${bitrate}k`);
      } else if (format === "wav") {
        args.push("-c:a", "pcm_s16le");
      } else if (format === "ogg") {
        args.push("-c:a", "libvorbis", "-b:a", `${bitrate}k`);
      } else if (format === "aac") {
        args.push("-c:a", "aac", "-b:a", `${bitrate}k`);
      } else if (format === "flac") {
        args.push("-c:a", "flac");
      }

      args.push("-vn", outputName); // -vn: video track'i kaldır

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: FORMAT_INFO[format].mime });
      setOutputSize(blob.size);
      setOutputUrl(URL.createObjectURL(blob));
      setProgress(100);
      setStatus("done");

      // Geçici dosyaları temizle
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err: any) {
      setStatus("ready");
      setErrorMsg("Dönüştürme başarısız. Dosya formatı desteklenmiyor olabilir.");
      console.error(err);
    }
  };

  const handleDownload = () => {
    if (!outputUrl || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `${baseName}.${format}`;
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

  const savings = file && outputSize ? Math.round((1 - outputSize / file.size) * 100) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", alignItems: "center", maxWidth: "680px", margin: "0 auto", padding: "2rem 1rem 5rem" }}>

      {/* Geri */}
      <div style={{ width: "100%", marginTop: "0.5rem" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.9rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Ana Sayfaya Dön
        </Link>
      </div>

      {/* Başlık */}
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "70px", height: "70px", borderRadius: "18px", background: "linear-gradient(135deg, #f59e0b, #ef4444)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", boxShadow: "0 8px 30px rgba(245,158,11,0.35)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, background: "linear-gradient(135deg, #f59e0b, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.5rem" }}>
          Ses Dönüştürücü
        </h1>
        <p className="subtitle" style={{ margin: 0 }}>MP3, WAV, OGG, AAC, FLAC — tarayıcıda, sunucusuz.</p>
      </div>

      {/* FFmpeg Yükleniyor */}
      {status === "loading" && (
        <div className="glass-panel" style={{ width: "100%", textAlign: "center", padding: "1.5rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", marginBottom: "0.75rem" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <p style={{ fontWeight: 600, marginBottom: "0.3rem" }}>Ses motoru yükleniyor...</p>
          <p style={{ fontSize: "0.82rem", opacity: 0.5 }}>İlk kullanımda ~10 saniye sürebilir.</p>
        </div>
      )}

      {/* Upload Alanı */}
      {status !== "loading" && (
        <div
          className="glass-panel"
          onClick={() => !file && fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          style={{
            width: "100%", cursor: file ? "default" : "pointer",
            border: isDragging ? "2px dashed #f59e0b" : "2px dashed rgba(255,255,255,0.12)",
            background: isDragging ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.04)",
            borderRadius: "16px", padding: "2rem", transition: "all 0.2s ease", textAlign: "center",
          }}
        >
          <input ref={fileInputRef} type="file" accept="audio/*,video/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

          {!file ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", opacity: 0.7 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <p style={{ fontSize: "1rem", fontWeight: 600 }}>Ses dosyası sürükle & bırak veya tıkla</p>
              <p style={{ fontSize: "0.82rem", opacity: 0.6 }}>MP3, WAV, OGG, AAC, FLAC, MP4 — Maks. 200MB</p>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "linear-gradient(135deg, #f59e0b, #ef4444)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.2rem", fontSize: "0.95rem" }}>{file.name}</p>
                <p style={{ opacity: 0.55, fontSize: "0.82rem" }}>
                  {formatBytes(file.size)}{duration ? ` · ${formatDuration(duration)}` : ""}
                </p>
              </div>
              <button onClick={e => { e.stopPropagation(); setFile(null); setOutputUrl(null); setOutputSize(null); setStatus("ready"); }} className="btn btn-secondary" style={{ padding: "0.4rem 0.9rem", fontSize: "0.82rem", marginLeft: "auto" }}>
                Değiştir
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ayarlar */}
      {file && (status === "ready" || status === "done" || status === "converting") && (
        <div className="glass-panel" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Format Seçimi */}
          <div>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Hedef Format</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.4rem" }}>
              {(Object.keys(FORMAT_INFO) as AudioFormat[]).map(fmt => {
                const info = FORMAT_INFO[fmt];
                const sel = format === fmt;
                return (
                  <button key={fmt} onClick={() => setFormat(fmt)} style={{
                    padding: "0.65rem 0.4rem", borderRadius: "10px",
                    border: sel ? `1.5px solid ${info.color}` : "1.5px solid rgba(255,255,255,0.08)",
                    background: sel ? `${info.color}18` : "rgba(255,255,255,0.03)",
                    color: sel ? info.color : "rgba(255,255,255,0.55)",
                    cursor: "pointer", transition: "all 0.15s ease", textAlign: "center",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{info.label}</div>
                    <div style={{ fontSize: "0.65rem", opacity: 0.7, marginTop: "2px" }}>{info.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bitrate (sadece kayıplı formatlar için) */}
          {["mp3", "ogg", "aac"].includes(format) && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bit Hızı</p>
                <span style={{ fontSize: "0.88rem", fontWeight: 700, opacity: 0.8 }}>{bitrate} kbps</span>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {["64", "96", "128", "192", "256", "320"].map(br => (
                  <button key={br} onClick={() => setBitrate(br)} style={{
                    flex: 1, padding: "0.45rem", borderRadius: "7px",
                    border: bitrate === br ? "1.5px solid #f59e0b" : "1.5px solid rgba(255,255,255,0.08)",
                    background: bitrate === br ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)",
                    color: bitrate === br ? "#f59e0b" : "rgba(255,255,255,0.5)",
                    cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                  }}>
                    {br}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dönüştür Butonu */}
          {status !== "converting" && (
            <button onClick={handleConvert} className="btn" style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", fontSize: "1rem", padding: "0.9rem" }}>
              {status === "done" ? `Tekrar Dönüştür (${FORMAT_INFO[format].label})` : `${FORMAT_INFO[format].label} olarak dönüştür`}
            </button>
          )}

          {/* Progress */}
          {status === "converting" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Dönüştürülüyor...</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b" }}>{progress}%</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "99px", height: "6px", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: "99px", background: "linear-gradient(90deg, #f59e0b, #ef4444)", width: `${progress}%`, transition: "width 0.3s ease" }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hata */}
      {errorMsg && (
        <div className="glass-panel" style={{ width: "100%", border: "1px solid #ef4444", background: "rgba(239,68,68,0.1)", padding: "1rem 1.5rem" }}>
          <p style={{ color: "#ef4444", textAlign: "center", fontWeight: 600 }}>{errorMsg}</p>
        </div>
      )}

      {/* Sonuç */}
      {status === "done" && outputUrl && file && (
        <div className="glass-panel" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem", animation: "fadeIn 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontWeight: 700, color: "#4ade80" }}>Dönüştürme tamamlandı!</span>
          </div>

          {/* İstatistikler */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {[
              { label: "Orijinal",         value: formatBytes(file.size),              color: "rgba(255,255,255,0.6)" },
              { label: "Dönüştürülmüş",    value: outputSize ? formatBytes(outputSize) : "—", color: "#a78bfa" },
              { label: "Fark",             value: savings !== null ? (savings > 0 ? `%${savings} küçük` : `%${Math.abs(savings!)} büyük`) : "—", color: savings && savings > 0 ? "#4ade80" : "#f87171" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", padding: "0.75rem", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.7rem", opacity: 0.45, marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Önizleme */}
          <audio controls src={outputUrl} style={{ width: "100%", borderRadius: "8px" }} />

          <button onClick={handleDownload} className="btn" style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {FORMAT_INFO[format].label} olarak indir
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
