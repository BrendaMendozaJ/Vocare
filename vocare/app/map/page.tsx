"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MatchProfile } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────
type CountryCode = "GHA" | "PER";
type LangCode = "en" | "es" | "tw";
type Mode = "checking" | "input" | "loading" | "dashboard";

// ─── Fonts ───────────────────────────────────────────────────────────────────
const MONO =
  '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
const SERIF =
  '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
const SANS =
  'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"';

// ─── Language options per country ─────────────────────────────────────────────
interface LangOption {
  code: LangCode;
  label: string;
  apiLang: string;
}
const LANG_OPTIONS: Record<CountryCode, LangOption[]> = {
  GHA: [
    { code: "en", label: "English", apiLang: "en" },
    { code: "tw", label: "Twi",     apiLang: "en" },
  ],
  PER: [
    { code: "es", label: "Español", apiLang: "es" },
  ],
};

// ─── i18n strings ─────────────────────────────────────────────────────────────
interface UiStrings {
  step: string;
  title: string;
  subtitle: string;
  country_label: string;
  lang_label: string;
  placeholder: string;
  cta: string;
  privacy: string;
  words: string;
  voice_hint: string;
  voice_stop: string;
  voice_listening: string;
  loading_steps: string[];
}

const T: Record<LangCode, UiStrings> = {
  en: {
    step: "STEP 1 OF 1",
    title: "Tell us your story.",
    subtitle:
      "Describe what you know, what you've done, and how you learned it. Use your own words — no formal credentials needed.",
    country_label: "YOUR COUNTRY CONTEXT",
    lang_label: "LANGUAGE",
    placeholder:
      "I have been repairing phones since I was 17...\nI speak English and Twi...\nI run my own small business at the market...\nI taught myself coding from YouTube.",
    cta: "MAP MY SKILLS TO THE WORLD →",
    privacy: "Your data is processed securely and never stored.",
    words: "words",
    voice_hint: "Tap to speak",
    voice_stop: "Tap to stop",
    voice_listening: "● RECORDING",
    loading_steps: [
      "Reading your story...",
      "Identifying your skills...",
      "Mapping to ISCO-08 standard...",
      "Calibrating for your economy...",
    ],
  },
  es: {
    step: "PASO 1 DE 1",
    title: "Cuéntanos tu historia.",
    subtitle:
      "Describe lo que sabes, lo que has hecho y cómo lo aprendiste. Usa tus propias palabras — no se necesitan credenciales formales.",
    country_label: "TU PAÍS",
    lang_label: "IDIOMA",
    placeholder:
      "He reparado celulares desde los 17 años...\nHablo español e inglés...\nManejo mi propio negocio en el mercado...\nAprendí a programar viendo videos en YouTube.",
    cta: "MAPEAR MIS HABILIDADES →",
    privacy: "Tus datos se procesan de forma segura y nunca son almacenados.",
    words: "palabras",
    voice_hint: "Toca para hablar",
    voice_stop: "Toca para detener",
    voice_listening: "● GRABANDO",
    loading_steps: [
      "Leyendo tu historia...",
      "Identificando tus habilidades...",
      "Mapeando al estándar ISCO-08...",
      "Calibrando para tu economía...",
    ],
  },
  tw: {
    step: "NHYEHYƐE 1",
    title: "Kasa ho wʼaseɛ.",
    subtitle:
      "Kyerɛ sɛdeɛ wonim, sɛdeɛ woyɛe, ne sɛdeɛ wosuaa. Di wo kasa ankasa — nnkrataa ntia ho nhia.",
    country_label: "WO ƆMAN",
    lang_label: "KASA",
    placeholder:
      "Mereyi fon ama afe 17 so...\nMekasa Twi ne Borɔfo...\nMewɔ me ho adwuma wura fie...\nMesuaa kɔdigo wɔ YouTube so.",
    cta: "KYERƐ ME NIMDEƐ WIASE MU →",
    privacy: "Wʼadata yɛ di so yɛe na wɔnkɔe da.",
    words: "nsɛm",
    voice_hint: "Kasa wʼaseɛ",
    voice_stop: "Gyae kasa",
    voice_listening: "● ƐTE SƐ",
    loading_steps: [
      "Ɛda wo aseɛ so...",
      "Ɛhwɛ wo nimdeɛ ho...",
      "Ɛkan ISCO-08 so...",
      "Ɛkan wo ɔman ho...",
    ],
  },
};

// ─── Dashboard helpers ────────────────────────────────────────────────────────
function countryName(code: CountryCode) {
  return code === "GHA" ? "Ghana" : "Peru";
}
function trendIcon(t: string) {
  return t === "growing" ? "↑" : t === "shrinking" ? "↓" : "→";
}
function trendColor(t: string) {
  return t === "growing" ? "#22c55e" : t === "shrinking" ? "#ef4444" : "#c4922a";
}
function typeBadgeStyle(type: string): { label: string; color: string } {
  switch (type) {
    case "formal":          return { label: "formal",       color: "#c4922a" };
    case "self_employment": return { label: "self-employ.", color: "#22c55e" };
    case "gig":             return { label: "gig",          color: "#38bdf8" };
    case "training":        return { label: "training",     color: "#a78bfa" };
    default:                return { label: type,           color: "#888"    };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MapPage() {
  const router = useRouter();

  const [mode, setMode]     = useState<Mode>("checking");
  const [country, setCountry] = useState<CountryCode>("GHA");
  const [lang, setLang]     = useState<LangCode>("en");

  // Input form
  const [text, setText]           = useState("");
  const [inputLoading, setInputLoading] = useState(false);
  const [inputError, setInputError]     = useState<string | null>(null);
  const [loadingStep, setLoadingStep]   = useState(0);

  // Voice (Web Speech API — Chrome/Edge)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef                    = useRef<any>(null);
  const [isListening, setIsListening]     = useState(false);
  const [hasSpeechAPI, setHasSpeechAPI]   = useState(false);
  const [micError, setMicError]           = useState<string | null>(null);

  // Dashboard
  const [matchData, setMatchData] = useState<MatchProfile | null>(null);
  const [iscoTitle, setIscoTitle] = useState("");

  // ── Derived ──────────────────────────────────────────────────────────────
  const t              = T[lang];
  const currentLangOpt = LANG_OPTIONS[country].find((l) => l.code === lang) ?? LANG_OPTIONS[country][0];
  const wordCount      = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const isActive       = wordCount >= 8;
  const counterColor   =
    wordCount === 0 ? "text-[#222]" : wordCount < 8 ? "text-[#c4922a]" : "text-green-600";

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setHasSpeechAPI(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (!inputLoading) { setLoadingStep(0); return; }
    setLoadingStep(0);
    const interval = setInterval(
      () => setLoadingStep((s) => (s + 1) % t.loading_steps.length),
      700
    );
    return () => clearInterval(interval);
  }, [inputLoading, t.loading_steps.length]);

  // When country changes: reset lang, stop any active recording
  useEffect(() => {
    setLang(LANG_OPTIONS[country][0].code);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [country]);

  // On mount: check localStorage → load M03 dashboard or show input form
  useEffect(() => {
    const storedProfile = localStorage.getItem("skillsProfile");
    const storedCountry = localStorage.getItem("selectedCountry");

    if (!storedProfile || !storedCountry) { setMode("input"); return; }

    let profile: { isco_title_en?: string };
    try { profile = JSON.parse(storedProfile); }
    catch { setMode("input"); return; }

    setCountry((storedCountry as CountryCode) ?? "GHA");
    setIscoTitle(profile.isco_title_en ?? "");
    setMode("loading");

    fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, country: storedCountry }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<MatchProfile>;
      })
      .then((data) => { setMatchData(data); setMode("dashboard"); })
      .catch(() => { setMode("input"); });
  }, []);

  // ── Voice (Web Speech API — Chrome / Edge) ───────────────────────────────
  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setMicError("Voice input requires Chrome or Edge."); return; }

    setMicError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = currentLangOpt.apiLang === "es" ? "es-PE" : "en-GH";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let chunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) chunk += e.results[i][0].transcript + " ";
      }
      if (chunk) setText((prev) => prev + chunk);
    };
    recognition.onend   = () => { setIsListening(false); recognitionRef.current = null; };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (e.error === "not-allowed") setMicError("Microphone access denied. Allow it in browser settings.");
      else if (e.error !== "no-speech") setMicError(`Voice error: ${e.error}`);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setMicError(null);
  }

  // ── Form submit ───────────────────────────────────────────────────────────
  async function onSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInputLoading(true);
    setInputError(null);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, country, language: currentLangOpt.apiLang }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? "API error");
      }
      const data = await res.json();
      localStorage.setItem("skillsProfile", JSON.stringify(data));
      localStorage.setItem("selectedCountry", country);
      router.push("/profile");
    } catch (e) {
      setInputError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setInputLoading(false);
    }
  }

  function startOver() {
    localStorage.removeItem("skillsProfile");
    localStorage.removeItem("selectedCountry");
    localStorage.removeItem("riskProfile");
    setMatchData(null);
    setText("");
    setMode("input");
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-50 grid grid-cols-3 items-center border-b border-[#1a1a1a] bg-[#0a0a0a] px-8 py-5">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="justify-self-start text-sm text-[#444] transition-colors hover:text-white"
          style={{ fontFamily: MONO }}
        >
          ← Back
        </button>
        <div className="justify-self-center text-lg font-bold text-white" style={{ fontFamily: MONO }}>
          VOC<span className="text-[#c4922a]">A</span>RE
        </div>
        <div className="justify-self-end text-xs text-[#444]" style={{ fontFamily: MONO }}>
          {countryName(country)} · {country}
        </div>
      </header>

      {/* CHECKING / LOADING market data */}
      {(mode === "checking" || mode === "loading") && (
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
          <div className="text-xs tracking-widest text-[#444]" style={{ fontFamily: MONO }}>
            ANALYZING YOUR LABOR MARKET...
          </div>
          <div className="h-0.5 w-48 overflow-hidden bg-[#1a1a1a]">
            <div className="h-full w-full origin-left bg-[#c4922a] animate-[barGrow_2s_ease-out_forwards]" />
          </div>
        </div>
      )}

      {/* INPUT FORM */}
      {mode === "input" && (
        <main className="mx-auto w-full max-w-2xl px-8 py-16">
          {/* Step */}
          <div className="mb-4 text-xs tracking-widest text-[#c4922a]" style={{ fontFamily: MONO }}>
            {t.step}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white md:text-5xl" style={{ fontFamily: SERIF }}>
            {t.title}
          </h1>

          {/* Subtitle */}
          <p className="mt-3 max-w-lg text-base font-light text-[#555]" style={{ fontFamily: SANS }}>
            {t.subtitle}
          </p>

          {/* Country selector */}
          <div className="mt-10">
            <div className="mb-3 text-xs tracking-widest text-[#444]" style={{ fontFamily: MONO }}>
              {t.country_label}
            </div>
            <div className="inline-flex gap-3">
              {(["GHA", "PER"] as CountryCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCountry(code)}
                  disabled={inputLoading}
                  className={[
                    "px-6 py-2.5 text-sm border transition-all duration-200",
                    country === code
                      ? "bg-white text-black border-white font-semibold"
                      : "bg-transparent text-[#444] border-[#222] hover:border-[#444]",
                  ].join(" ")}
                  style={{ fontFamily: MONO }}
                >
                  {code === "GHA" ? "🇬🇭 Ghana" : "🇵🇪 Peru"}
                </button>
              ))}
            </div>
          </div>

          {/* Language selector — only shown when >1 option (Ghana) */}
          {LANG_OPTIONS[country].length > 1 && (
            <div className="mt-6">
              <div className="mb-3 text-xs tracking-widest text-[#444]" style={{ fontFamily: MONO }}>
                {t.lang_label}
              </div>
              <div className="inline-flex gap-3">
                {LANG_OPTIONS[country].map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setLang(opt.code)}
                    disabled={inputLoading}
                    className={[
                      "px-5 py-2 text-sm border transition-all duration-200",
                      lang === opt.code
                        ? "bg-[#c4922a] text-black border-[#c4922a] font-semibold"
                        : "bg-transparent text-[#444] border-[#222] hover:border-[#c4922a] hover:text-[#c4922a]",
                    ].join(" ")}
                    style={{ fontFamily: MONO }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Textarea */}
          <div className="mt-8">
            <textarea
              id="skills-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.placeholder}
              className="w-full min-h-[220px] resize-none rounded-none border border-[#1e1e1e] bg-[#0f0f0f] p-6 text-base font-light text-white placeholder:text-[#2a2a2a] outline-none transition-colors duration-300 focus:border-[#c4922a]"
              style={{ fontFamily: SANS }}
              disabled={inputLoading}
            />
            <div
              className={["mt-2 text-right text-xs", counterColor].join(" ")}
              style={{ fontFamily: MONO }}
            >
              {wordCount} {t.words}
            </div>
          </div>

          {/* Mic button — centered, Chrome/Edge via Web Speech API */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={inputLoading}
              aria-label={isListening ? t.voice_stop : t.voice_hint}
              className={[
                "relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-300 focus:outline-none",
                isListening
                  ? "border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)] cursor-pointer"
                  : hasSpeechAPI
                    ? "border-[#2a2a2a] bg-[#0f0f0f] text-[#555] hover:border-[#c4922a] hover:text-[#c4922a] hover:shadow-[0_0_16px_rgba(196,146,42,0.15)] cursor-pointer"
                    : "border-[#1a1a1a] bg-[#0a0a0a] text-[#222] cursor-not-allowed",
              ].join(" ")}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
              {isListening && (
                <span className="pointer-events-none absolute inset-[-6px] rounded-full border border-red-500/40 animate-ping" />
              )}
            </button>

            <span
              className={[
                "text-[10px] tracking-widest transition-colors duration-200",
                isListening ? "text-red-400" : "text-[#2a2a2a]",
              ].join(" ")}
              style={{ fontFamily: MONO }}
            >
              {isListening
                ? t.voice_listening
                : hasSpeechAPI
                  ? t.voice_hint
                  : "Chrome / Edge only"}
            </span>

            {micError && (
              <p className="mt-1 max-w-xs text-center text-[10px] text-red-400" style={{ fontFamily: SANS }}>
                {micError}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={inputLoading || !isActive}
            className={[
              "mt-8 w-full py-5 text-sm uppercase tracking-widest transition-all duration-300",
              inputLoading
                ? "bg-[#111] text-[#333] cursor-not-allowed"
                : isActive
                  ? "bg-[#c4922a] text-black font-bold cursor-pointer hover:bg-[#d4a030] animate-pulse-gold"
                  : "bg-[#111] text-[#333] cursor-not-allowed",
            ].join(" ")}
            style={{ fontFamily: MONO }}
          >
            {inputLoading ? (
              <span className="inline-block animate-fade-in-up opacity-0">
                {t.loading_steps[loadingStep]}
              </span>
            ) : (
              t.cta
            )}
          </button>

          {inputLoading && (
            <div className="relative mt-3 h-0.5 w-full overflow-hidden bg-[#1a1a1a]">
              <div
                className="absolute left-0 top-0 h-full bg-[#c4922a] animate-[barGrow_3000ms_ease-out_forwards]"
                style={{ ["--bar-width" as string]: "100%" }}
              />
            </div>
          )}

          {inputError && (
            <div className="mt-4 text-[12px] text-red-400" style={{ fontFamily: SANS }}>
              {inputError}
            </div>
          )}

          <div className="mt-6 text-center text-xs text-[#222]" style={{ fontFamily: MONO }}>
            {t.privacy}
          </div>
        </main>
      )}

      {/* M03 DASHBOARD */}
      {mode === "dashboard" && matchData && (
        <main className="mx-auto w-full max-w-4xl px-6 py-10 md:px-10">
          <div className="mb-8 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs tracking-widest text-[#c4922a]" style={{ fontFamily: MONO }}>
                MARKET INTELLIGENCE · {country}
              </div>
              <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl" style={{ fontFamily: SERIF }}>
                Opportunity Map
              </h1>
              {iscoTitle && (
                <div className="mt-1 text-sm text-[#555]" style={{ fontFamily: SANS }}>
                  Calibrated for: <span className="text-[#888]">{iscoTitle}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={startOver}
              className="mt-3 self-start border border-[#2a2a2a] px-4 py-2 text-xs text-[#444] transition-colors hover:border-[#444] hover:text-white md:mt-0 md:self-auto"
              style={{ fontFamily: MONO }}
            >
              ← Start over
            </button>
          </div>

          {/* SECTION A — ECONOMETRIC SIGNALS */}
          <section className="mb-8">
            <div className="mb-3 text-xs tracking-widest text-[#444]" style={{ fontFamily: MONO }}>
              ECONOMETRIC SIGNALS · REAL DATA {matchData.econometric_signals[0]?.year ?? "2025"}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {matchData.econometric_signals.slice(0, 2).map((sig) => (
                <div key={sig.id} className="border border-[#1e1e1e] bg-[#0f0f0f] p-6">
                  <div className="text-4xl font-black text-[#c4922a] md:text-5xl" style={{ fontFamily: SERIF }}>
                    {sig.value}
                    <span className="ml-1 text-xl text-[#555]">{sig.unit}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white" style={{ fontFamily: MONO }}>
                    {sig.label}
                  </div>
                  <div className="mt-1 text-xs text-[#444]" style={{ fontFamily: MONO }}>
                    {sig.year} · {sig.source}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-[#666]" style={{ fontFamily: SANS }}>
                    {sig.interpretation}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION B — LABOR MARKET ALERT */}
          <section className="mb-8">
            <div className="border-l-2 border-[#c4922a] bg-[#0f0c07] p-5">
              <div className="text-xs tracking-widest text-[#c4922a]" style={{ fontFamily: MONO }}>
                ⚠ LABOR MARKET ALERT
              </div>
              <div className="mt-2 text-base font-bold text-white" style={{ fontFamily: MONO }}>
                {matchData.labor_market_alert.warning}
              </div>
              {matchData.labor_market_alert.ratio && (
                <div className="mt-2 text-sm text-[#c4922a]" style={{ fontFamily: MONO }}>
                  {matchData.labor_market_alert.ratio}
                </div>
              )}
              <p className="mt-3 text-xs leading-relaxed text-[#888]" style={{ fontFamily: SANS }}>
                <span className="font-semibold text-white">VOCARE RECOMMENDS:</span>{" "}
                {matchData.labor_market_alert.vocare_actionable}
              </p>
              <div className="mt-2 text-[10px] text-[#333]" style={{ fontFamily: MONO }}>
                Source: {matchData.labor_market_alert.source}
              </div>
            </div>
          </section>

          {/* SECTION C — SECTOR EMPLOYMENT */}
          {matchData.matched_sectors.length > 0 && (
            <section className="mb-8">
              <div className="mb-3 text-xs tracking-widest text-[#444]" style={{ fontFamily: MONO }}>
                WHERE PEOPLE WORK IN {country} · ILO / ILOSTAT DATA
              </div>
              <div className="space-y-3">
                {(() => {
                  const maxEmp = Math.max(...matchData.matched_sectors.map((s) => s.employment_thousands));
                  return matchData.matched_sectors.map((sector) => (
                    <div key={sector.name} className="border border-[#1a1a1a] bg-[#0a0a0a] p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white" style={{ fontFamily: MONO }}>
                            {sector.name}
                          </span>
                          {sector.relevance === "high" && (
                            <span className="border border-[#c4922a] px-1.5 py-0.5 text-[9px] text-[#c4922a]" style={{ fontFamily: MONO }}>
                              YOUR SECTOR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: trendColor(sector.trend), fontFamily: MONO }}>
                            {trendIcon(sector.trend)} {sector.trend}
                          </span>
                          <span className="text-xs text-[#555]" style={{ fontFamily: MONO }}>
                            {sector.employment_thousands.toLocaleString()}K
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-[#1a1a1a]">
                        <div
                          className="h-full bg-[#c4922a] transition-[width] duration-700"
                          style={{ width: `${Math.round((sector.employment_thousands / maxEmp) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[10px] text-[#333]" style={{ fontFamily: MONO }}>
                        {sector.pct_of_total}% of total employment
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </section>
          )}

          {/* SECTION D — OPPORTUNITIES */}
          <section className="mb-8">
            <div className="mb-1 text-xs tracking-widest text-[#444]" style={{ fontFamily: MONO }}>
              REALISTIC OPPORTUNITIES FOR YOU
            </div>
            <div className="mb-4 text-[10px] text-[#333]" style={{ fontFamily: MONO }}>
              Based on local labor market data · wages in USD/month estimates
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matchData.opportunities.map((opp, i) => {
                const badge = typeBadgeStyle(opp.type);
                return (
                  <div key={`${opp.title}-${i}`} className="flex flex-col border border-[#1e1e1e] bg-[#0f0f0f] p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <span
                        className="border px-2 py-0.5 text-[9px] uppercase tracking-widest"
                        style={{ borderColor: badge.color, color: badge.color, fontFamily: MONO }}
                      >
                        {badge.label}
                      </span>
                      {opp.realistic && (
                        <span className="text-[9px] text-green-500" style={{ fontFamily: MONO }}>
                          ✓ realistic
                        </span>
                      )}
                    </div>
                    <div className="mb-1 text-sm font-semibold leading-snug text-white" style={{ fontFamily: SANS }}>
                      {opp.title}
                    </div>
                    <div className="mb-3 text-xs text-[#555]" style={{ fontFamily: MONO }}>
                      {opp.sector}
                      {opp.wage_estimate_usd_month !== null && <> · ~${opp.wage_estimate_usd_month}/mo</>}
                    </div>
                    <p className="mt-auto text-[11px] leading-relaxed text-[#444]" style={{ fontFamily: SANS }}>
                      {opp.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* JOB SEARCH LINKS */}
          <section className="mb-8">
            <div className="mb-3 text-xs tracking-widest text-[#444]" style={{ fontFamily: MONO }}>
              FIND JOBS NOW
            </div>
            <div className="flex flex-wrap gap-3">
              {matchData.job_search_links.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-[#2a2a2a] px-4 py-2 text-xs text-[#888] transition-colors hover:border-[#c4922a] hover:text-[#c4922a]"
                  style={{ fontFamily: MONO }}
                >
                  {link.replace("https://", "")} →
                </a>
              ))}
            </div>
          </section>

          {/* SOURCES */}
          <footer className="border-t border-[#1a1a1a] pt-6">
            <div className="mb-2 text-[9px] tracking-widest text-[#333]" style={{ fontFamily: MONO }}>
              DATA SOURCES
            </div>
            <div className="text-[10px] leading-relaxed text-[#2a2a2a]" style={{ fontFamily: MONO }}>
              {matchData.sources.join(" · ")}
            </div>
          </footer>
        </main>
      )}
    </div>
  );
}
