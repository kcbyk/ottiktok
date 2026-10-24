#!/usr/bin/env node
/**
 * YouTube indirme API adaylarını CANLI test eder.
 *
 * Kullanım:
 *   node scripts/test-download-apis.mjs
 *   MP3_API_KEY=sk-... COBALT_API_URL=https://... node scripts/test-download-apis.mjs
 *
 * Sandbox ağ politikaları bazı hostları engelleyebilir; en doğru sonuç için
 * kendi makineninde / Render-Vercel ortamında çalıştır.
 *
 * Çıktı: her aday için durum, süre ve kısa özet + özet tablosu.
 * Bağımlılık yoktur (Node 18+ global fetch yeterlidir).
 */

const VIDEO = process.env.TEST_VIDEO || "https://www.youtube.com/watch?v=jNQXAC9IVRw"; // "Me at the zoo" (19 sn)
const MP3_BASE = process.env.MP3_API_URL || "https://mp3-apisi.onrender.com";
const MP3_KEY = process.env.MP3_API_KEY || "sk-71c69f4de1f4b912957fed45"; // repodaki varsayılan (sızmış — rotate et)
const COBALT_URL = process.env.COBALT_API_URL || ""; // kendi instance'ın (önerilen)
const TIMEOUT = Number(process.env.TEST_TIMEOUT_MS || 15000);

// Ek korumasız Cobalt instance'ları — SADECE test/karşılaştırma için.
// Üretimde bunları sabit kodlama; kendi instance'ını kur (docs/indirme-api-arastirma.md).
const COMMUNITY_COBALT = [
  { name: "rue-cobalt.xenon.zone", url: "https://rue-cobalt.xenon.zone" },
  { name: "cobaltapi.cjs.nz", url: "https://cobaltapi.cjs.nz" },
];

const results = [];
const C = {
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  bad: (s) => `\x1b[31m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[90m${s}\x1b[0m`,
  b: (s) => `\x1b[1m${s}\x1b[0m`,
};

async function timedFetch(url, opts = {}, ms = TIMEOUT) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  const start = Date.now();
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal, redirect: "follow" });
    const text = await res.text();
    return { res, text, ms: Date.now() - start };
  } finally {
    clearTimeout(t);
  }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function record(name, status, detail, ms, kind = "info") {
  results.push({ name, status, detail, ms, kind });
  const mark = status === "OK" ? C.ok("✔ OK") : status === "FAIL" ? C.bad("✘ FAIL") : C.warn("⚠ WARN");
  console.log(`${mark}  ${C.b(name)}  ${C.dim(`${ms ?? "-"}ms`)}\n      ${detail}`);
}

/* ── 1. mp3-apisi sağlık ─────────────────────────────────────────── */
async function testMp3Health() {
  const name = "mp3-apisi /api/v1/health";
  try {
    const { res, text, ms } = await timedFetch(`${MP3_BASE}/api/v1/health`);
    const j = safeJson(text);
    record(name, res.ok ? "OK" : "FAIL",
      `${res.status} · ${JSON.stringify(j || text).slice(0, 160)}`, ms);
  } catch (e) { record(name, "FAIL", `${e.name}: ${e.message}`, TIMEOUT); }
}

/* ── 2. mp3-apisi arama ──────────────────────────────────────────── */
async function testMp3Search() {
  const name = "mp3-apisi /api/v1/search";
  const url = `${MP3_BASE}/api/v1/search?q=${encodeURIComponent("never gonna give you up")}&limit=3&key=${encodeURIComponent(MP3_KEY)}`;
  try {
    const { res, text, ms } = await timedFetch(url);
    const j = safeJson(text);
    const n = j?.sonuclar?.length ?? 0;
    record(name, j?.ok && n > 0 ? "OK" : "FAIL",
      `${res.status} · ${n} sonuç · ilk: ${j?.sonuclar?.[0]?.baslik || j?.hata || "-"}`, ms);
  } catch (e) { record(name, "FAIL", `${e.name}: ${e.message}`, TIMEOUT); }
}

/* ── 3. mp3-apisi MP3 instant + status ───────────────────────────── */
async function testMp3Instant(format, quality) {
  const name = `mp3-apisi /instant (${format}/${quality})`;
  const url = `${MP3_BASE}/api/v1/instant?q=${encodeURIComponent("me at the zoo")}&format=${format}&kalite=${quality}&key=${encodeURIComponent(MP3_KEY)}`;
  try {
    const { res, text, ms } = await timedFetch(url);
    const j = safeJson(text);
    if (!j?.ok || !j?.durum_url) {
      record(name, "FAIL", `${res.status} · ${JSON.stringify(j || text).slice(0, 160)}`, ms);
      return;
    }
    // Durumu 25 sn boyunca yokla
    let last = null;
    const deadline = Date.now() + 25000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const s = await timedFetch(`${MP3_BASE}${j.durum_url}${j.durum_url.includes("?") ? "&" : "?"}key=${encodeURIComponent(MP3_KEY)}`, {}, 8000);
        last = safeJson(s.text);
      } catch { /* yoklamaya devam */ }
      if (last && (last.durum === "bitti" || last.durum === "hata" || last.durum === "failed")) break;
    }
    const total = ms;
    if (last?.durum === "bitti") {
      record(name, "OK", `job ${j.job_id} → bitti · ${last.dosya || last.dosya_url} · ${last.sure?.toFixed?.(1) ?? "?"} sn`, total);
    } else if (last?.durum === "hata" || last?.durum === "failed") {
      record(name, "FAIL", `job ${j.job_id} → ${last.durum}: ${last.hata || "?"}`, total);
    } else {
      record(name, "WARN", `job ${j.job_id} → durum alınamadı/zaman aşımı`, total);
    }
  } catch (e) { record(name, "FAIL", `${e.name}: ${e.message}`, TIMEOUT); }
}

/* ── 4. mp3-apisi /link (direkt CDN) ─────────────────────────────── */
async function testMp3Link(format) {
  const name = `mp3-apisi /link (${format})`;
  const url = `${MP3_BASE}/api/v1/link?q=${encodeURIComponent("me at the zoo")}&format=${format}&key=${encodeURIComponent(MP3_KEY)}`;
  try {
    const { res, text, ms } = await timedFetch(url);
    const j = safeJson(text);
    if (!j?.ok || !j?.link) {
      record(name, "FAIL", `${res.status} · ${JSON.stringify(j || text).slice(0, 160)}`, ms);
      return;
    }
    // Linkin gerçekten dosya döndürüp döndürmediğini HEAD/GET ile doğrula
    let verified = "doğrulanamadı";
    try {
      const v = await timedFetch(j.link, { method: "GET", headers: { Range: "bytes=0-2047" } }, 12000);
      const ct = v.res.headers.get("content-type") || "";
      verified = `${v.res.status} ${ct}${/text\/html/i.test(ct) ? " (REKLAM/HTML!)" : ""}`;
    } catch (e) { verified = `link alındı ama doğrulanamadı: ${e.name}`; }
    record(name, "WARN", `link: ${j.link.slice(0, 90)}… · doğrulama: ${verified}`, ms);
  } catch (e) { record(name, "FAIL", `${e.name}: ${e.message}`, TIMEOUT); }
}

/* ── 5. Cobalt instance — GET / (sağlık + servis listesi) ────────── */
async function testCobaltInfo(inst) {
  const name = `Cobalt GET / — ${inst.name}`;
  try {
    const { res, text, ms } = await timedFetch(inst.url, { headers: { Accept: "application/json" } }, 12000);
    const j = safeJson(text);
    const yt = j?.cobalt?.services?.includes("youtube");
    const ver = j?.cobalt?.version || "?";
    record(name, j?.cobalt ? "OK" : "FAIL",
      `${res.status} · v${ver} · youtube:${yt ? "VAR ✅" : "YOK ❌"} · servis:${j?.cobalt?.services?.length ?? "?"}`, ms);
    return !!yt;
  } catch (e) { record(name, "FAIL", `${e.name}: ${e.message}`, 12000); return false; }
}

/* ── 6. Cobalt instance — POST / (GERÇEK indirme testi) ─────────── */
async function testCobaltPost(inst, { audioOnly = false } = {}) {
  const name = `Cobalt POST / — ${inst.name}${audioOnly ? " (mp3)" : " (mp4)"}`;
  const body = audioOnly
    ? { url: VIDEO, downloadMode: "audio", audioFormat: "mp3", audioBitrate: "128" }
    : { url: VIDEO, videoQuality: "360", youtubeVideoCodec: "h264", downloadMode: "auto" };
  try {
    const { res, text, ms } = await timedFetch(inst.url, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, 25000);
    const j = safeJson(text);
    const st = j?.status || "?"
    const okStatus = ["tunnel", "redirect", "picker", "local-processing"].includes(st);
    const detail = `${res.status} · status=${st} · ${j?.url || j?.error?.code || text.slice(0, 100)}`;
    record(name, okStatus ? "OK" : "FAIL", detail, ms);
    // RateLimit başlıklarını göster
    const rl = res.headers.get("ratelimit-remaining");
    if (rl !== null) console.log(C.dim(`      RateLimit-Remaining: ${rl}`));
    return okStatus;
  } catch (e) { record(name, "FAIL", `${e.name}: ${e.message}`, 25000); return false; }
}

/* ── 7. btch-downloader-api (no-auth demo) ───────────────────────── */
async function testBtch() {
  const base = "https://btch-downloader-api-green.vercel.app";
  for (const [label, path] of [["health", "/api/health"], ["health?deep=1", "/api/health?deep=1"]]) {
    const name = `btch-downloader-api /${label}`;
    try {
      const { res, text, ms } = await timedFetch(`${base}${path}`, {}, 20000);
      const j = safeJson(text);
      const ok = label === "health" ? j?.status === "ok" : j?.upstream?.ok === true;
      record(name, ok ? "OK" : "FAIL",
        `${res.status} · ${JSON.stringify(j || text).slice(0, 170)}`, ms);
    } catch (e) { record(name, "FAIL", `${e.name}: ${e.message}`, 20000); }
  }
  const name = "btch-downloader-api /api/download/youtube";
  try {
    const { res, text, ms } = await timedFetch(
      `${base}/api/download/youtube?url=${encodeURIComponent(VIDEO)}`, {}, 28000);
    const j = safeJson(text);
    const hasMedia = j?.success && (j?.normalized?.media?.length || j?.result?.url || j?.result?.mp4);
    record(name, hasMedia ? "OK" : "FAIL",
      `${res.status} · ${JSON.stringify(j || text).slice(0, 170)}`, ms);
  } catch (e) { record(name, "FAIL", `${e.name}: ${e.message} (upstream timeout → Issue #147)`, 28000); }
}

/* ── 8. Invidious / Piped örnekleri ──────────────────────────────── */
async function testOpenProxies() {
  const id = "jNQXAC9IVRw";
  const targets = [
    ["Invidious inv.nadeko.net", `https://inv.nadeko.net/api/v1/videos/${id}`],
    ["Invidious yewtu.be", `https://yewtu.be/api/v1/videos/${id}`],
    ["Piped pipedapi.adminforge.de", `https://pipedapi.adminforge.de/streams/${id}`],
  ];
  for (const [name, url] of targets) {
    try {
      const { res, text, ms } = await timedFetch(url, {}, 12000);
      const j = safeJson(text);
      const ok = res.ok && j && (j.title || j.videoStreams);
      record(name, ok ? "OK" : "FAIL", `${res.status} · ${(text || "").slice(0, 110)}`, ms);
    } catch (e) { record(name, "FAIL", `${e.name}: ${e.message}`, 12000); }
  }
}

/* ── 9. Resmî api.cobalt.tools servis listesi ────────────────────── */
async function testOfficialCobalt() {
  const name = "api.cobalt.tools GET / (resmî)";
  try {
    const { res, text, ms } = await timedFetch("https://api.cobalt.tools/", { headers: { Accept: "application/json" } }, 12000);
    const j = safeJson(text);
    const yt = j?.cobalt?.services?.includes("youtube");
    record(name, yt ? "OK" : "WARN",
      `${res.status} · v${j?.cobalt?.version || "?"} · youtube:${yt ? "VAR" : "YOK (ana instance kapalı)"}`, ms);
  } catch (e) { record(name, "FAIL", `${e.name}: ${e.message}`, 12000); }
}

/* ── Özet ────────────────────────────────────────────────────────── */
function summary() {
  console.log("\n" + C.b("═══════════════════ ÖZET ═══════════════════"));
  const ok = results.filter((r) => r.status === "OK").length;
  const warn = results.filter((r) => r.status === "WARN").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  console.log(`${C.ok(ok + " OK")}  ${C.warn(warn + " WARN")}  ${C.bad(fail + " FAIL")}\n`);
  for (const r of results) {
    const s = r.status === "OK" ? C.ok("OK  ") : r.status === "FAIL" ? C.bad("FAIL") : C.warn("WARN");
    console.log(`  ${s}  ${r.name}`);
  }
  console.log(C.dim("\nNot: 'FAIL' her zaman servisin ölü olduğu anlamına gelmez; sandbox ağ engeli"),
    C.dim(" veya kısa ömürlü CDN linki de buna yol açabilir. Kendi ağında tekrar çalıştır."));
  console.log(C.dim("Ayrıntılar: docs/indirme-api-arastirma.md\n"));
}

(async () => {
  console.log(C.b(`\n▶ YouTube indirme API canlı testi — ${new Date().toISOString()}`));
  console.log(C.dim(`  Test videosu: ${VIDEO}`));
  console.log(C.dim(`  mp3-apisi:    ${MP3_BASE}`));
  console.log(C.dim(`  Cobalt(kendi):${COBALT_URL || " (tanımlı değil → community instance'ları test edilecek)"}\n`));

  await testMp3Health();
  await testMp3Search();
  await testMp3Instant("mp3", "128");
  await testMp3Instant("mp4", "360");
  await testMp3Link("mp3");
  await testMp3Link("mp4");

  await testOfficialCobalt();

  const cobaltTargets = COBALT_URL
    ? [{ name: "kendi instance'ın", url: COBALT_URL }]
    : COMMUNITY_COBALT;

  for (const inst of cobaltTargets) {
    const hasYt = await testCobaltInfo(inst);
    if (hasYt) {
      await testCobaltPost(inst, { audioOnly: false }); // MP4
      await testCobaltPost(inst, { audioOnly: true });  // MP3
    }
  }

  await testBtch();
  await testOpenProxies();
  summary();
})();
