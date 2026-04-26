"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCounter(end: number, duration = 1500, inView: boolean) {
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

export default function HomePage() {
  const router = useRouter();

  const hero = useInView();
  const problem = useInView();
  const how = useInView();
  const stats = useInView();
  const footer = useInView();

  const count1 = useCounter(600, 1500, stats.inView);
  const count2 = useCounter(190, 1200, stats.inView);
  const count3 = useCounter(80, 1000, stats.inView);

  return (
    <div className="min-h-dvh bg-[#f5f0e8] text-[#0a0a0a]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#d4c9b0] bg-[#f5f0e8] px-10 py-5">
        <div
          className="text-lg font-bold tracking-wide"
          style={{
            fontFamily:
              '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          VOC<span className="text-[#c4922a]">A</span>RE
        </div>
        <div
          className="hidden text-xs tracking-widest text-[#888] md:block"
          style={{
            fontFamily:
              '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          WORLD BANK × HACK-NATION · UNMAPPED CHALLENGE
        </div>
        <div
          className="text-xs text-[#888]"
          style={{
            fontFamily:
              '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          UNMAPPED CHALLENGE 2026
        </div>
      </header>

      {/* SECTION 1 — HERO */}
      <section
        ref={hero.ref}
        className={`grid min-h-screen grid-cols-1 transition-all duration-700 ${hero.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} md:grid-cols-2`}
      >
        <div className="flex flex-col justify-center p-10 md:p-16">
          <div
            className="text-xs tracking-widest text-[#c4922a]"
            style={{
              fontFamily:
                '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            SKILLS INTELLIGENCE PLATFORM
          </div>

          <h1
            className="mt-6 text-5xl font-black leading-none md:text-7xl"
            style={{
              fontFamily:
                '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            }}
          >
            Make your
            <br />
            skills <span className="italic text-[#c4922a]">visible</span>
            <br />
            to the world.
          </h1>

          <p
            className="mt-6 max-w-sm text-base font-light text-[#555]"
            style={{
              fontFamily:
                'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
            }}
          >
            Amara has been repairing phones since she was 17. To the formal economy, she doesn&apos;t
            exist. VOCARE changes that.
          </p>

          <button
            type="button"
            onClick={() => router.push("/map")}
            className="animate-pulse-gold mt-10 w-fit bg-[#0a0a0a] px-10 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#c4922a] hover:text-black"
            style={{
              fontFamily:
                '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            MAP MY SKILLS →
          </button>
        </div>

        <div className="flex items-center justify-center bg-[#f5f0e8] p-10 md:p-16">
          <Image
            src="/illustrations/profile-data-pana.png"
            alt="Profile mapping illustration"
            width={720}
            height={720}
            className="w-full max-w-md animate-float"
            priority
          />
        </div>
      </section>

      {/* SECTION 2 — PROBLEM */}
      <section
        ref={problem.ref}
        className={`bg-[#0a0a0a] py-24 text-white transition-all duration-700 ${problem.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="mx-auto max-w-6xl px-10 md:px-16">
          <div
            className="text-center text-xs tracking-widest text-[#c4922a]"
            style={{
              fontFamily:
                '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            THE PROBLEM
          </div>
          <h2
            className="mt-6 whitespace-pre-line text-center text-4xl font-bold italic md:text-5xl"
            style={{
              fontFamily:
                '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            }}
          >
            Three failures.{"\n"}One challenge.
          </h2>

          <div className="mt-8 space-y-4">
            {[
              {
                title: "BROKEN SIGNALS",
                body: "Education credentials don't translate into labor market signals. Informal skills are invisible.",
              },
              {
                title: "AI DISRUPTION WITHOUT READINESS",
                body: "Automation is arriving unevenly. Youth have no tools to understand or navigate this.",
              },
              {
                title: "NO MATCHING INFRASTRUCTURE",
                body: "Even where skills and jobs exist in the same place, the connective tissue is absent.",
              },
            ].map((card, index) => (
              <div
                key={card.title}
                className={[
                  "mx-auto max-w-sm border-l-2 border-[#c4922a] pl-6 text-center",
                  problem.inView ? "animate-fade-in-up opacity-0" : "opacity-0",
                ].join(" ")}
                style={problem.inView ? { animationDelay: `${index * 150}ms` } : undefined}
              >
              <div
                className="text-xs uppercase tracking-widest text-[#c4922a]"
                style={{
                  fontFamily:
                    '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                }}
              >
                {card.title}
              </div>
              <p
                className="mt-1 text-sm text-[#888]"
                style={{
                  fontFamily:
                    'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
                }}
              >
                {card.body}
              </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS */}
      <section
        ref={how.ref}
        className={`bg-[#f5f0e8] py-24 transition-all duration-700 ${how.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="mx-auto max-w-6xl px-10 md:px-16">
          <div
            className="text-center text-xs tracking-widest text-[#c4922a]"
            style={{
              fontFamily:
                '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            HOW VOCARE WORKS
          </div>
          <h2
            className="mt-4 text-center text-4xl font-black text-[#0a0a0a] md:text-5xl"
            style={{
              fontFamily:
                '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            }}
          >
            From invisible to recognized.
          </h2>

          <div className="mt-16 grid grid-cols-2 items-center gap-16">
            <div className="grid grid-cols-1 gap-10">
              {[
                {
                  n: "01",
                  title: "YOU DESCRIBE",
                  body: "Tell us what you know in plain language. No formal credentials required.",
                },
                {
                  n: "02",
                  title: "WE TRANSLATE",
                  body: "Our system maps your skills to ISCO-08 — the international standard recognized in 190 countries.",
                },
                {
                  n: "03",
                  title: "YOU OWN IT",
                  body: "Get an honest AI readiness assessment and a portable skills profile you can use anywhere.",
                },
              ].map((s) => (
                <div key={s.n}>
                  <div
                    className="text-6xl font-black text-[#c4922a]"
                    style={{
                      fontFamily:
                        '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                    }}
                  >
                    {s.n}
                  </div>
                  <div className="my-4 h-px w-12 bg-[#c4922a]" />
                  <div
                    className="text-sm uppercase tracking-widest text-[#0a0a0a]"
                    style={{
                      fontFamily:
                        '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    }}
                  >
                    {s.title}
                  </div>
                  <p
                    className="mt-2 text-sm text-[#555]"
                    style={{
                      fontFamily:
                        'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
                    }}
                  >
                    {s.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center">
              <Image
                src="/illustrations/profile-data-bro.png"
                alt="From invisible to recognized illustration"
                width={640}
                height={640}
                className="mx-auto max-w-sm animate-float"
              />
            </div>
          </div>

          <div className="mt-16 flex justify-center">
            <button
              type="button"
              onClick={() => router.push("/map")}
              className="animate-pulse-gold bg-[#0a0a0a] px-10 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#c4922a] hover:text-black"
              style={{
                fontFamily:
                  '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
            >
              START NOW — IT&apos;S FREE →
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4 — STATS BAR */}
      <section
        ref={stats.ref}
        className={`bg-[#0a0a0a] py-12 text-white transition-all duration-700 ${stats.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-10 text-center md:grid-cols-3 md:px-16">
          {[
            { n: `${count1}M`, label: "YOUTH WITH UNMAPPED SKILLS" },
            { n: `${count2}`, label: "COUNTRIES RECOGNIZING ISCO-08" },
            { n: `${count3}%`, label: "GHANA INFORMAL ECONOMY" },
          ].map((s) => (
            <div key={s.label} className="animate-[countUp_0.5s_ease-out_forwards] opacity-0">
              <div
                className="text-5xl font-black text-[#c4922a]"
                style={{
                  fontFamily:
                    '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                }}
              >
                {s.n}
              </div>
              <div
                className="mt-2 text-xs uppercase tracking-widest text-gray-500"
                style={{
                  fontFamily:
                    '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        ref={footer.ref}
        className={`border-t border-[#1a1a1a] bg-[#0a0a0a] py-8 text-white transition-all duration-700 ${footer.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-10 md:flex-row md:items-center md:justify-between md:px-16">
          <div
            className="text-sm text-[#444]"
            style={{
              fontFamily:
                '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            VOCARE
          </div>
          <div
            className="text-xs text-[#333]"
            style={{
              fontFamily:
                '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            Powered by ISCO-08 · Frey &amp; Osborne (2013) · Wittgenstein Centre · ILO ILOSTAT · World Bank WDI
          </div>
        </div>
      </footer>
    </div>
  );
}
