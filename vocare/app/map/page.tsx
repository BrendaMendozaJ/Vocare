"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CountryCode = "GHA" | "PER";

function countryName(code: CountryCode) {
  return code === "GHA" ? "Ghana" : "Peru";
}

export default function MapPage() {
  const router = useRouter();

  const [country, setCountry] = useState<CountryCode>("GHA");
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const language = useMemo(() => (country === "PER" ? "es" : "en"), [country]);

  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const isActive = wordCount >= 5;
  const counterColor = wordCount === 0 ? "text-[#222]" : wordCount < 20 ? "text-[#c4922a]" : "text-green-600";
  const steps = [
    "Reading your story...",
    "Identifying your skills...",
    "Mapping to ISCO-08 standard...",
    "Calibrating for your economy...",
  ];

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    setLoadingStep(0);
    const t = setInterval(() => {
      setLoadingStep((s) => (s + 1) % steps.length);
    }, 700);
    return () => clearInterval(t);
  }, [loading, steps.length]);

  async function onSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, country, language }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      localStorage.setItem("skillsProfile", JSON.stringify(data));
      localStorage.setItem("selectedCountry", country);

      router.push("/profile");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 grid grid-cols-3 items-center border-b border-[#1a1a1a] bg-[#0a0a0a] px-8 py-5">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="justify-self-start text-sm text-[#444] transition-colors hover:text-white"
          style={{
            fontFamily:
              '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          ← Back
        </button>

        <div
          className="justify-self-center text-lg font-bold text-white"
          style={{
            fontFamily:
              '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          VOC<span className="text-[#c4922a]">A</span>RE
        </div>

        <div
          className="justify-self-end text-xs text-[#444]"
          style={{
            fontFamily:
              '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          {countryName(country)} · {country}
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto w-full max-w-2xl px-8 py-16">
        <div
          className="mb-4 text-xs tracking-widest text-[#c4922a]"
          style={{
            fontFamily:
              '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          STEP 1 OF 1
        </div>

        <h1
          className="text-4xl font-bold text-white md:text-5xl"
          style={{
            fontFamily:
              '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
          }}
        >
          Tell us your story.
        </h1>

        <p
          className="mt-3 max-w-lg text-base font-light text-[#555]"
          style={{
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
          }}
        >
          Describe what you know, what you&apos;ve done, and how you learned it. Use your own words —
          no formal credentials needed.
        </p>

        <div className="mt-10">
          <div
            className="mb-3 text-xs tracking-widest text-[#444]"
            style={{
              fontFamily:
                '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            YOUR COUNTRY CONTEXT
          </div>

          <div className="inline-flex gap-3">
            <button
              type="button"
              onClick={() => setCountry("GHA")}
              disabled={loading}
              className={[
                "px-6 py-2.5 text-sm border transition-all duration-200",
                country === "GHA"
                  ? "bg-white text-black border-white font-semibold"
                  : "bg-transparent text-[#444] border-[#222] hover:border-[#444]",
              ].join(" ")}
              style={{
                fontFamily:
                  '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
            >
              🇬🇭 Ghana
            </button>

            <button
              type="button"
              onClick={() => setCountry("PER")}
              disabled={loading}
              className={[
                "px-6 py-2.5 text-sm border transition-all duration-200",
                country === "PER"
                  ? "bg-white text-black border-white font-semibold"
                  : "bg-transparent text-[#444] border-[#222] hover:border-[#444]",
              ].join(" ")}
              style={{
                fontFamily:
                  '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
            >
              🇵🇪 Peru
            </button>
          </div>
        </div>

        <div className="mt-8">
          <textarea
            id="skills-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              "I have been repairing phones since I was 17...\nI speak English and Twi...\nI run my own small business at the market...\nI taught myself coding from YouTube."
            }
            className="w-full min-h-[220px] resize-none rounded-none border border-[#1e1e1e] bg-[#0f0f0f] p-6 text-base font-light text-white placeholder:text-[#2a2a2a] outline-none transition-colors duration-300 focus:border-[#c4922a]"
            style={{
              fontFamily:
                'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
            }}
            disabled={loading}
          />

          <div
            className={["mt-2 text-right text-xs", counterColor].join(" ")}
            style={{
              fontFamily:
                '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            {wordCount} words
          </div>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || !isActive}
          className={[
            "mt-8 w-full py-5 text-sm uppercase tracking-widest transition-all duration-300",
            loading
              ? "bg-[#111] text-[#333] cursor-not-allowed"
              : isActive
                ? "bg-[#c4922a] text-black font-bold cursor-pointer hover:bg-[#d4a030] animate-pulse-gold"
                : "bg-[#111] text-[#333] cursor-not-allowed",
          ].join(" ")}
          style={{
            fontFamily:
              '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          {loading ? (
            <span className="inline-block animate-fade-in-up opacity-0">{steps[loadingStep]}</span>
          ) : (
            "MAP MY SKILLS TO THE WORLD →"
          )}
        </button>

        {loading ? (
          <div className="relative mt-3 h-0.5 w-full overflow-hidden bg-[#1a1a1a]">
            <div
              className="absolute left-0 top-0 h-full bg-[#c4922a] animate-[barGrow_3000ms_ease-out_forwards]"
              style={{ ["--bar-width" as any]: "100%" }}
            />
          </div>
        ) : null}

        {error ? <div className="mt-4 text-[12px] text-[var(--rust)]">{error}</div> : null}

        <div
          className="mt-6 text-center text-xs text-[#222]"
          style={{
            fontFamily:
              '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          Your data is processed securely and never stored.
        </div>
      </main>

      <style jsx global>{`
        .vocare-dots::after {
          content: "";
          display: inline-block;
          width: 1.2em;
          text-align: left;
          animation: vocareDots 1.1s steps(4, end) infinite;
        }
        @keyframes vocareDots {
          0% {
            content: "";
          }
          25% {
            content: ".";
          }
          50% {
            content: "..";
          }
          75% {
            content: "...";
          }
          100% {
            content: "";
          }
        }
      `}</style>
    </div>
  );
}

