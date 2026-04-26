"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type RiskLabel = "bajo" | "medio" | "alto";

type WittBar = {
  year: string | number;
  tertiary: number;
};

type RiskResponse = {
  adjusted_score: number;
  risk_label: RiskLabel;
  lmic_factor: string | number;
  durable_skills?: string[];
  at_risk_skills?: string[];
  adjacent_skills?: string[];
  wittgenstein?: WittBar[];
};

function labelToEnglish(label: RiskLabel) {
  return label === "bajo" ? "Low risk" : label === "medio" ? "Medium risk" : "High risk";
}

function countryName(code: string) {
  return code === "GHA" ? "Ghana" : code === "PER" ? "Peru" : code || "—";
}

export default function RiskPage() {
  const router = useRouter();

  const [country, setCountry] = useState<string>("GHA");
  const [skillsProfile, setSkillsProfile] = useState<unknown>(null);
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [barPct, setBarPct] = useState(0);
  const [riskScore, setRiskScore] = useState(0);

  const wittRef = useRef<HTMLDivElement | null>(null);
  const [wittInView, setWittInView] = useState(false);

  useEffect(() => {
    const storedCountry = localStorage.getItem("selectedCountry");
    const storedSkills = localStorage.getItem("skillsProfile");
    const storedRisk = localStorage.getItem("riskProfile");
    if (storedCountry) setCountry(storedCountry);

    if (!storedSkills) {
      setError("Missing skills profile. Return to /profile to generate a profile first.");
      return;
    }

    try {
      setSkillsProfile(JSON.parse(storedSkills));
    } catch {
      setError("Invalid saved skills profile.");
      return;
    }

    if (!storedRisk) {
      setError("Missing risk profile. Go to /profile and click “See AI displacement risk →”.");
      return;
    }

    try {
      const parsedRisk = JSON.parse(storedRisk) as RiskResponse;
      setRisk(parsedRisk);
    } catch {
      setError("Invalid saved risk profile.");
    }
  }, []);

  const pct = risk ? Math.round(risk.adjusted_score * 100) : 0;
  const label = risk?.risk_label;

  useEffect(() => {
    setBarPct(0);
    const t1 = setTimeout(() => setBarPct(pct), 300);
    return () => {
      clearTimeout(t1);
    };
  }, [pct, risk]);

  useEffect(() => {
    const target = risk?.adjusted_score ?? 0;
    setRiskScore(0);
    if (!risk) return;
    const step = Math.max(0.001, target / (1000 / 20));
    const timer = setInterval(() => {
      setRiskScore((v) => {
        const next = v + step;
        if (next >= target) {
          clearInterval(timer);
          return target;
        }
        return next;
      });
    }, 20);
    return () => clearInterval(timer);
  }, [risk]);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setWittInView(true);
    }, { threshold: 0.15 });
    if (wittRef.current) obs.observe(wittRef.current);
    return () => obs.disconnect();
  }, []);

  const scoreClass =
    label === "bajo" ? "text-[var(--risk-low)]" : label === "medio" ? "text-[var(--risk-mid)]" : "text-[var(--risk-high)]";
  const fillClass =
    label === "bajo" ? "bg-[var(--risk-low)]" : label === "medio" ? "bg-[var(--risk-mid)]" : "bg-[var(--risk-high)]";

  const witt = risk?.wittgenstein ?? [];
  const maxTertiary = useMemo(() => Math.max(0, ...witt.map((w) => w.tertiary)), [witt]);

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b-[1.5px] border-[var(--ink)] bg-[var(--paper)] px-10 py-5">
        <div
          className="text-[22px] font-extrabold uppercase tracking-[0.15em]"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          VO<span className="text-[var(--gold)]">C</span>ARE
        </div>
        <div className="hidden text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] sm:block">
          World Bank × Hack-Nation · UNMAPPED Challenge
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
          {countryName(country)} · {country}
        </div>
      </header>

      {/* Risk header */}
      <div className="flex items-center justify-between border-b-[1.5px] border-[var(--ink)] px-[60px] py-8">
        <div>
          <div className="mb-1 text-[9px] uppercase tracking-[0.3em] text-[var(--muted)]">
            AI Readiness &amp; Displacement Risk
          </div>
          <div className="text-[28px] font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
            Calibrated for <span>{countryName(country)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="border border-[var(--border)] bg-transparent px-5 py-[10px] text-[11px] tracking-[0.1em] text-[var(--muted)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            ← Back to profile
          </button>
          <button
            type="button"
            onClick={() => router.push("/map")}
            className="border border-[var(--ink)] bg-[var(--ink)] px-5 py-[10px] text-[11px] tracking-[0.1em] text-[var(--paper)] transition-colors hover:bg-[var(--gold)] hover:border-[var(--gold)] hover:text-[var(--ink)]"
          >
            Find Opportunities →
          </button>
        </div>
      </div>

      {error ? <div className="px-[60px] py-4 text-[12px] text-[var(--rust)]">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left */}
        <section className="border-b-[1.5px] border-[var(--ink)] px-[60px] py-10 md:border-b-0 md:border-r-[1.5px]">
          <div className="mb-10">
            <div className="mb-3 text-[9px] uppercase tracking-[0.3em] text-[var(--muted)]">
              Automation risk score (Frey-Osborne 2013, LMIC-calibrated)
            </div>
            <div
              className={["text-[80px] font-black leading-none", scoreClass].join(" ")}
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {risk ? riskScore.toFixed(2) : "—"}
            </div>
            <div className="my-4 h-2 bg-[var(--border)]">
              <div
                className={["h-full transition-[width] duration-[1200ms]", fillClass].join(" ")}
                style={{ width: `${barPct}%` }}
              />
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              {risk ? `${labelToEnglish(risk.risk_label)} · Calibrated for ${countryName(country)} labor market` : "Loading…"}
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-3 border-b border-[var(--border)] pb-2 text-[9px] uppercase tracking-[0.3em] text-[var(--risk-low)]">
              ✓ Durable skills — these protect you
            </div>
            <div>
              {(risk?.durable_skills ?? []).filter(Boolean).length ? (
                (risk?.durable_skills ?? [])
                  .filter(Boolean)
                  .map((s, i) => (
                    <span
                      key={`dur-${s}`}
                      className="animate-fade-in-up mr-1 mt-1 inline-block border border-[var(--risk-low)] px-3 py-[6px] text-[11px] text-[var(--risk-low)]"
                      style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
                    >
                      {s}
                    </span>
                  ))
              ) : (
                <span className="text-[12px] text-[var(--muted)]">None identified</span>
              )}
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-3 border-b border-[var(--border)] pb-2 text-[9px] uppercase tracking-[0.3em] text-[var(--risk-high)]">
              ⚠ At-risk skills — these are changing
            </div>
            <div>
              {(risk?.at_risk_skills ?? []).filter(Boolean).length ? (
                (risk?.at_risk_skills ?? [])
                  .filter(Boolean)
                  .map((s, i) => (
                    <span
                      key={`risk-${s}`}
                      className="animate-fade-in-up mr-1 mt-1 inline-block border border-[var(--risk-high)] px-3 py-[6px] text-[11px] text-[var(--risk-high)]"
                      style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
                    >
                      {s}
                    </span>
                  ))
              ) : (
                <span className="text-[12px] text-[var(--muted)]">None identified</span>
              )}
            </div>
          </div>

          <div className="mb-2">
            <div className="mb-3 border-b border-[var(--border)] pb-2 text-[9px] uppercase tracking-[0.3em] text-[var(--sky)]">
              → Adjacent skills — what to learn next
            </div>
            <div>
              {(risk?.adjacent_skills ?? []).map((s, i) => (
                <span
                  key={`adj-${s}`}
                  className="animate-fade-in-up mr-1 mt-1 inline-block border border-[var(--sky)] px-3 py-[6px] text-[11px] text-[var(--sky)]"
                  style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Right */}
        <section className="px-[60px] py-10">
          <div className="mb-5 text-[9px] uppercase tracking-[0.3em] text-[var(--muted)]">
            Your region&apos;s education trajectory · 2020–2035 (Wittgenstein Centre WCDE v3)
          </div>

          <div ref={wittRef} className="flex h-[160px] items-end gap-2 border-b-[1.5px] border-[var(--ink)]">
            {witt.map((w) => {
              const hPx = maxTertiary ? (w.tertiary / maxTertiary) * 120 : 0;
              const index = witt.findIndex((x) => x.year === w.year);
              return (
                <div key={`w-${w.year}`} className="flex h-full flex-1 flex-col items-center justify-end">
                  <div className="mb-1 text-[9px] font-medium text-[var(--ink)]">{w.tertiary}%</div>
                  <div
                    className="w-full bg-[var(--gold)]"
                    style={{
                      height: wittInView ? `${hPx}px` : "0px",
                      transition: `height 0.8s ease-out ${index * 150}ms`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-[6px] flex justify-between">
            {witt.map((w) => (
              <div key={`wl-${w.year}`} className="flex-1 text-center text-[9px] text-[var(--muted)]">
                {w.year}
              </div>
            ))}
          </div>

          <div className="animate-slide-right mt-6 bg-[var(--forest)] p-5 text-[var(--paper)]" style={{ animationDelay: "400ms" }}>
            <div className="mb-2 text-[9px] uppercase tracking-[0.2em] text-[#aaa]">LMIC Calibration Factor</div>
            <div className="text-[12px] leading-[1.6] text-[#ddd]">
              Automation risk is not the same everywhere. A phone repair technician in Accra faces
              different pressures than one in Frankfurt. We calibrate Frey-Osborne scores for your
              local context.
            </div>
            <div className="mt-2 text-[32px] font-bold text-[var(--gold-light)]" style={{ fontFamily: "var(--font-playfair)" }}>
              {risk ? `${risk.lmic_factor}×` : "—"}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

