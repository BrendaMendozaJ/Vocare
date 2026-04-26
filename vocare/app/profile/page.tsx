"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SkillType = "technical" | "digital" | "transversal" | "language" | string;

type Skill = {
  label_en: string;
  type: SkillType;
  level: string;
};

type SkillsProfile = {
  isco_code: string;
  isco_title_en: string;
  education_level: string;
  portability_score?: number;
  skills?: Skill[];
};

function countryName(code: string) {
  return code === "GHA" ? "Ghana" : code === "PER" ? "Peru" : code || "—";
}

function educationTitleCase(s: string) {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function badgeColors(type: SkillType) {
  switch (type) {
    case "technical":
      return "border-[var(--rust)] text-[var(--rust)]";
    case "digital":
      return "border-[var(--sky)] text-[var(--sky)]";
    case "transversal":
      return "border-[var(--forest)] text-[var(--forest)]";
    case "language":
      return "border-[var(--gold)] text-[var(--gold)]";
    default:
      return "border-[var(--muted)] text-[var(--muted)]";
  }
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<SkillsProfile | null>(null);
  const [country, setCountry] = useState<string>("GHA");
  const [riskLoading, setRiskLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barWidth, setBarWidth] = useState("0%");
  const [iscoCount, setIscoCount] = useState(0);

  const globeRef = useRef<HTMLDivElement | null>(null);
  const [globeInView, setGlobeInView] = useState(false);
  const [globeCount, setGlobeCount] = useState(0);

  function useCounter(end: number, duration = 1200, inView: boolean) {
    const [count, setCount] = useState(0);
    useEffect(() => {
      if (!inView) return;
      let start = 0;
      const step = end / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }, [inView, end, duration]);
    return count;
  }

  useEffect(() => {
    const storedProfile = localStorage.getItem("skillsProfile");
    const storedCountry = localStorage.getItem("selectedCountry");
    if (storedCountry) setCountry(storedCountry);

    if (!storedProfile) {
      setError("Missing skills profile. Go back to the homepage and submit your skills first.");
      return;
    }

    try {
      const parsed = JSON.parse(storedProfile) as SkillsProfile;
      setProfile(parsed);
    } catch {
      setError("Invalid saved skills profile.");
    }
  }, []);

  const portabilityPct = useMemo(() => {
    const p = profile?.portability_score ?? 0;
    return Math.max(0, Math.min(100, Math.round(p * 100)));
  }, [profile?.portability_score]);

  useEffect(() => {
    // animate after render
    setBarWidth("0%");
    const t = setTimeout(() => setBarWidth(`${portabilityPct}%`), 300);
    return () => clearTimeout(t);
  }, [portabilityPct]);

  useEffect(() => {
    const code = profile?.isco_code;
    const target = Number.parseInt(code ?? "", 10);
    if (!Number.isFinite(target)) return;
    setIscoCount(0);
    const duration = 800;
    const step = Math.max(1, Math.floor(target / (duration / 16)));
    const timer = setInterval(() => {
      setIscoCount((c) => {
        const next = c + step;
        if (next >= target) {
          clearInterval(timer);
          return target;
        }
        return next;
      });
    }, 16);
    return () => clearInterval(timer);
  }, [profile?.isco_code]);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setGlobeInView(true);
    });
    if (globeRef.current) obs.observe(globeRef.current);
    return () => obs.disconnect();
  }, []);

  const counted190 = useCounter(190, 1100, globeInView);
  useEffect(() => {
    if (globeInView) setGlobeCount(counted190);
  }, [globeInView, counted190]);

  async function viewRisk() {
    if (!profile) return;
    setRiskLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, country }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      localStorage.setItem("riskProfile", JSON.stringify(data));
      router.push("/risk");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading risk");
    } finally {
      setRiskLoading(false);
    }
  }

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

      {/* Profile header */}
      <div className="flex flex-col justify-between gap-8 border-b-[1.5px] border-[var(--ink)] px-[60px] py-10 md:flex-row md:items-start">
        <div className="flex items-baseline gap-4">
          <div
            className="text-[72px] font-black leading-none text-[var(--gold)]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {profile?.isco_code ? String(iscoCount).padStart(4, "0") : "—"}
          </div>
          <div>
            <div className="mb-1 text-[9px] uppercase tracking-[0.3em] text-[var(--muted)]">
              ISCO-08 Occupation Code · Recognized in 190 countries
            </div>
            <div
              className="max-w-[400px] text-[22px] font-bold leading-[1.3]"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {profile?.isco_title_en ?? "—"}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="mb-3">
            <div className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">Education level</div>
            <div className="text-[16px] font-semibold" style={{ fontFamily: "var(--font-syne)" }}>
              {educationTitleCase(profile?.education_level ?? "")}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">Country context</div>
            <div className="text-[16px] font-semibold" style={{ fontFamily: "var(--font-syne)" }}>
              {countryName(country)}
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="px-[60px] py-4 text-[12px] text-[var(--rust)]">{error}</div> : null}

      {/* Body split */}
      <div className="grid min-h-[calc(100dvh-65px-164px)] grid-cols-1 md:grid-cols-2">
        {/* Skills panel */}
        <section className="border-b-[1.5px] border-[var(--ink)] px-[60px] py-10 md:border-b-0 md:border-r-[1.5px]">
          <div className="mb-6 text-[9px] uppercase tracking-[0.3em] text-[var(--muted)]">
            Identified skills — portable across borders &amp; sectors
          </div>

          <div className="space-y-[10px]">
            {(profile?.skills ?? []).map((s, i) => (
              <div
                key={`${s.label_en}-${i}`}
                className="animate-fade-in-up flex items-center justify-between border border-[var(--border)] bg-[var(--card)] px-5 py-4"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
              >
                <div className="text-[13px] font-medium">{s.label_en}</div>
                <div className="flex gap-[6px]">
                  <span className={["border px-2 py-[3px] text-[9px] uppercase tracking-[0.15em]", badgeColors(s.type)].join(" ")}>
                    {s.type}
                  </span>
                  <span className="border border-[var(--muted)] px-2 py-[3px] text-[9px] uppercase tracking-[0.15em] text-[var(--muted)]">
                    {s.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Portability panel */}
        <section className="flex flex-col justify-between px-[60px] py-10">
          <div>
            <div className="mb-6 text-[9px] uppercase tracking-[0.3em] text-[var(--muted)]">Portability score</div>
            <div
              className="text-[96px] font-black leading-none text-[var(--ink)]"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {portabilityPct}
              <span className="ml-1 align-baseline text-[36px] text-[var(--muted)]">%</span>
            </div>
            <div className="my-4 h-1 bg-[var(--border)]">
              <div
                className="h-full bg-[var(--gold)]"
                style={{
                  ["--bar-width" as any]: barWidth,
                  animation: "barGrow 1s ease forwards",
                }}
              />
            </div>
            <div className="max-w-[280px] text-[11px] leading-[1.6] text-[var(--muted)]">
              How recognized and transferable your skills are across different countries and economic
              contexts.
            </div>
          </div>

          <div>
            <div ref={globeRef} className="bg-[var(--ink)] p-6 text-[var(--paper)]">
              <div
                className="text-[48px] font-black text-[var(--gold-light)]"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {globeCount}
              </div>
              <div className="mt-1 text-[11px] text-[#aaa]">
                countries use ISCO-08 as their occupational standard. Your profile is valid in all of
                them.
              </div>
            </div>

            <button
              type="button"
              onClick={viewRisk}
              disabled={riskLoading || !profile}
              className="animate-pulse-gold mt-5 flex w-full items-center justify-between border-[1.5px] border-[var(--ink)] bg-transparent px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              <span>{riskLoading ? "Loading risk data..." : "See AI displacement risk →"}</span>
              <span />
            </button>
          </div>
        </section>
      </div>

      <style jsx global>{``}</style>
    </div>
  );
}

