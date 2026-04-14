import React from "react";
import AppIcon, { type AppIconName } from "../components/AppIcon";
import {
  useCollaborators,
  usePublications,
  useSiteContent,
} from "../firebase/hooks";

const About: React.FC = () => {
  const { content, loading } = useSiteContent();
  const { collaborators } = useCollaborators();
  const { ongoing, published } = usePublications();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{
            borderColor: "var(--color-primary)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );

  const sections = [
    {
      titleKey: "about.section1Title",
      textKey: "about.section1Text",
      number: "01",
      icon: "building" as AppIconName,
      accent: "var(--color-primary)",
    },
    {
      titleKey: "about.section2Title",
      textKey: "about.section2Text",
      number: "02",
      icon: "lab" as AppIconName,
      accent: "var(--color-secondary)",
    },
    {
      titleKey: "about.section3Title",
      textKey: "about.section3Text",
      number: "03",
      icon: "collaborators" as AppIconName,
      accent: "var(--color-accent)",
    },
  ];

  const stats = [
    {
      value: collaborators.length,
      label: "Collaborators",
      icon: "collaborators" as AppIconName,
    },
    {
      value: published.length,
      label: "Publications",
      icon: "paper" as AppIconName,
    },
    {
      value: ongoing.length,
      label: "Ongoing Projects",
      icon: "lab" as AppIconName,
    },
  ];

  return (
    <div style={{ background: "var(--color-bg)" }}>
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-24 text-center px-4"
        style={{ background: "var(--color-primary)" }}
      >
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Accent glow */}
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: "var(--color-accent)",
            transform: "translate(30%, 40%)",
          }}
        />

        {content["about.bannerUrl"] && (
          <img
            src={content["about.bannerUrl"]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.35)" }}
          />
        )}

        <div className="relative z-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border"
            style={{
              borderColor: "rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.07)",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "var(--color-accent)" }}
            />
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Rahman Research Lab
            </span>
          </div>

          <h1
            className="font-black text-white mb-4"
            style={{
              fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)",
              fontFamily: "var(--font-heading)",
              letterSpacing: "-1px",
            }}
          >
            {content["about.pageTitle"] ?? "About the Lab"}
          </h1>
          <div
            className="mx-auto mb-5 h-1 w-16 rounded-full"
            style={{ background: "var(--color-accent)" }}
          />
          <p
            className="text-base max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            {content["about.pageSubtitle"] ?? ""}
          </p>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section style={{ background: "var(--color-primary)" }}>
        <div
          className="max-w-3xl mx-auto px-4 grid grid-cols-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="text-center py-6 px-4"
              style={{
                borderRight:
                  i < stats.length - 1
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "none",
              }}
            >
              <div className="mb-1 inline-flex text-white/80">
                <AppIcon name={s.icon} size={20} />
              </div>
              <div
                className="text-3xl font-black leading-none"
                style={{
                  color: "var(--color-accent)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {s.value}
              </div>
              <div
                className="text-xs mt-1.5 font-medium"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Main Sections (separated) ── */}
      {sections.map((s, idx) => {
        if (!content[s.titleKey]) return null;
        const isEven = idx % 2 === 1;
        return (
          <section
            key={s.titleKey}
            className="px-4 py-10 md:py-12"
            style={{ background: isEven ? "#ffffff" : "#f8fafc" }}
          >
            <div className="max-w-5xl mx-auto">
              <div
                className="rounded-3xl overflow-hidden"
                style={{
                  background: isEven ? "#f8fafc" : "white",
                  border: "1px solid #e8eef4",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  className={`flex flex-col md:flex-row ${isEven ? "md:flex-row-reverse" : ""}`}
                >
                  {/* Number / Icon panel */}
                  <div
                    className="flex flex-col items-center justify-center px-10 py-12 flex-shrink-0"
                    style={{
                      background: `linear-gradient(160deg, ${s.accent}18 0%, ${s.accent}08 100%)`,
                      minWidth: 180,
                      borderRight: !isEven ? `1px solid ${s.accent}20` : "none",
                      borderLeft: isEven ? `1px solid ${s.accent}20` : "none",
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                      style={{
                        background: `${s.accent}15`,
                        border: `2px solid ${s.accent}30`,
                      }}
                    >
                      <AppIcon name={s.icon} size={28} />
                    </div>
                    <span
                      className="font-black text-5xl leading-none"
                      style={{
                        color: `${s.accent}25`,
                        fontFamily: "var(--font-heading)",
                        letterSpacing: "-3px",
                      }}
                    >
                      {s.number}
                    </span>
                  </div>

                  {/* Text content */}
                  <div className="flex-1 px-8 py-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-1 h-8 rounded-full flex-shrink-0"
                        style={{ background: s.accent }}
                      />
                      <h2
                        className="font-black text-2xl"
                        style={{
                          color: "var(--color-primary)",
                          fontFamily: "var(--font-heading)",
                        }}
                      >
                        {content[s.titleKey]}
                      </h2>
                    </div>
                    <p
                      className="text-gray-600 leading-relaxed text-base"
                      style={{ whiteSpace: "pre-line", lineHeight: 1.85 }}
                    >
                      {content[s.textKey]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* ── Mission & Vision ── */}
      {(content["about.missionTitle"] || content["about.visionTitle"]) && (
        <section
          className="py-16 px-4"
          style={{
            background: "var(--color-primary)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="max-w-5xl mx-auto relative z-10">
            {/* Section label */}
            <div className="text-center mb-10">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <span
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Our Purpose
                </span>
              </div>
              <h2
                className="text-white font-black text-3xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Mission & Vision
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mission */}
              {content["about.missionTitle"] && (
                <div
                  className="rounded-3xl p-8 relative overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {/* Top accent */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--color-accent), #f97316)",
                    }}
                  />
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
                    style={{
                      background: "rgba(245,158,11,0.15)",
                      border: "1px solid rgba(245,158,11,0.3)",
                    }}
                  >
                    <AppIcon name="ideas" size={24} />
                  </div>
                  <h3
                    className="font-black text-xl text-white mb-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {content["about.missionTitle"]}
                  </h3>
                  <p
                    className="leading-relaxed text-sm"
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      whiteSpace: "pre-line",
                      lineHeight: 1.8,
                    }}
                  >
                    {content["about.missionText"]}
                  </p>
                </div>
              )}

              {/* Vision */}
              {content["about.visionTitle"] && (
                <div
                  className="rounded-3xl p-8 relative overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {/* Top accent */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--color-secondary), #6366f1)",
                    }}
                  />
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
                    style={{
                      background: "rgba(37,99,235,0.15)",
                      border: "1px solid rgba(37,99,235,0.3)",
                    }}
                  >
                    <AppIcon name="lab" size={24} />
                  </div>
                  <h3
                    className="font-black text-xl text-white mb-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {content["about.visionTitle"]}
                  </h3>
                  <p
                    className="leading-relaxed text-sm"
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      whiteSpace: "pre-line",
                      lineHeight: 1.8,
                    }}
                  >
                    {content["about.visionText"]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Strip ── */}
      <section className="py-14 px-4" style={{ background: "#f1f5f9" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h3
            className="font-black text-2xl mb-3"
            style={{
              color: "var(--color-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Want to collaborate with us?
          </h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            We welcome researchers, academics, and industry partners to join our
            growing network.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="/collaborators"
              className="no-underline font-bold text-sm px-7 py-3 rounded-xl text-white"
              style={{
                background: "var(--color-primary)",
                boxShadow: "0 4px 16px rgba(30,58,95,0.25)",
              }}
            >
              Meet the Team →
            </a>
            <a
              href="/contact"
              className="no-underline font-bold text-sm px-7 py-3 rounded-xl border-2"
              style={{
                color: "var(--color-primary)",
                borderColor: "var(--color-primary)",
                background: "transparent",
              }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
