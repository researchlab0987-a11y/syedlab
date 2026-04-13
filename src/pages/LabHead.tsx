import React from "react";
import { Link } from "react-router-dom";
import AppIcon from "../components/AppIcon";
import { useThemeContext } from "../context/ThemeContext";
import { useSiteContent } from "../firebase/hooks";

interface LabHeadData {
  name: string;
  title: string;
  department: string;
  photo: string;
  shortBio: string;
  fullBio: string;
  email: string;
  phone: string;
  linkedin: string;
  scholar: string;
  orcid: string;
  researchgate: string;
  researchInterests: string;
}

const LabHeadAvatar: React.FC<{
  photo: string;
  name: string;
  size: number;
}> = ({ photo, name, size }) => {
  const [err, setErr] = React.useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (photo && !err) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: 20,
          objectFit: "cover",
          border: "1px solid rgba(148,163,184,0.35)",
          boxShadow: "0 12px 34px rgba(15,23,42,0.18)",
        }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center text-white font-black"
      style={{
        width: size,
        height: size,
        borderRadius: 20,
        background:
          "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
        fontSize: size * 0.28,
        border: "1px solid rgba(148,163,184,0.35)",
        boxShadow: "0 12px 34px rgba(15,23,42,0.18)",
      }}
    >
      {initials}
    </div>
  );
};

const LabHead: React.FC = () => {
  const { content, loading } = useSiteContent();
  const { theme } = useThemeContext();

  const isDarkTheme = React.useMemo(() => {
    const clean = (theme.backgroundColor ?? "").replace("#", "").trim();
    if (clean.length !== 6) return false;
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 140;
  }, [theme.backgroundColor]);

  const labHead: LabHeadData = {
    name: content["labhead.name"] ?? "",
    title: content["labhead.title"] ?? "",
    department: content["labhead.department"] ?? "",
    photo: content["labhead.photo"] ?? "",
    shortBio: content["labhead.shortBio"] ?? "",
    fullBio: content["labhead.fullBio"] ?? "",
    email: content["labhead.email"] ?? "",
    phone: content["labhead.phone"] ?? "",
    linkedin: content["labhead.linkedin"] ?? "",
    scholar: content["labhead.scholar"] ?? "",
    orcid: content["labhead.orcid"] ?? "",
    researchgate: content["labhead.researchgate"] ?? "",
    researchInterests: content["labhead.researchInterests"] ?? "",
  };

  const interests = labHead.researchInterests
    ? labHead.researchInterests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const links = [
    {
      href: labHead.linkedin,
      label: "LinkedIn",
      color: "#0a66c2",
      icon: "collaborators" as const,
    },
    {
      href: labHead.scholar,
      label: "Google Scholar",
      color: "#4285f4",
      icon: "paper" as const,
    },
    {
      href: labHead.orcid,
      label: "ORCID",
      color: "#84cc16",
      icon: "about" as const,
    },
    {
      href: labHead.researchgate,
      label: "ResearchGate",
      color: "#06b6d4",
      icon: "lab" as const,
    },
  ].filter((l) => l.href);

  const softText = isDarkTheme ? "#dbe4ee" : "#334155";
  const softMuted = isDarkTheme ? "#8ea3ba" : "#64748b";
  const pageBg = isDarkTheme ? "#0b1220" : "#f4f8fc";
  const surfaceBg = isDarkTheme ? "#111b2f" : "#ffffff";
  const softSurfaceBg = isDarkTheme ? "#13233d" : "#f8fbff";
  const borderColor = isDarkTheme
    ? "rgba(148,163,184,0.28)"
    : "rgba(148,163,184,0.24)";
  const headerGradient = `linear-gradient(130deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 70%)`;

  if (loading) {
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
  }

  if (!labHead.name) {
    return (
      <div className="min-h-[70vh]" style={{ background: pageBg }}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div
            className="rounded-3xl border p-10 text-center"
            style={{
              borderColor,
              background: surfaceBg,
              boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
            }}
          >
            <div
              className="inline-flex mb-4 p-3 rounded-2xl"
              style={{ background: "rgba(14,165,233,0.12)" }}
            >
              <AppIcon
                name="admin"
                size={24}
                style={{ color: "var(--color-primary)" }}
              />
            </div>
            <h1
              className="text-3xl font-black"
              style={{
                color: "var(--color-primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              Lab Head Profile
            </h1>
            <p className="text-sm mt-3" style={{ color: softMuted }}>
              No lab head profile has been published yet. Update it from the
              admin Content Editor under the Lab Head tab.
            </p>
            <Link
              to="/"
              className="inline-flex mt-5 rounded-full px-5 py-2.5 text-sm font-bold no-underline"
              style={{
                background: "var(--color-primary)",
                color: "white",
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: pageBg }}>
      <section
        className="relative overflow-hidden"
        style={{ background: headerGradient }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 10% 30%, rgba(255,255,255,0.2), transparent 35%), radial-gradient(circle at 90% 20%, rgba(255,255,255,0.16), transparent 38%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <p
            className="text-[11px] uppercase tracking-[0.2em] font-black"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            Leadership Profile
          </p>
          <h1
            className="text-3xl md:text-4xl font-black mt-2"
            style={{ color: "white", fontFamily: "var(--font-heading)" }}
          >
            Meet the Lab Head
          </h1>
          <p
            className="text-sm mt-3 max-w-2xl"
            style={{ color: "rgba(255,255,255,0.82)" }}
          >
            Research direction, academic profile, and contact information.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-12 -mt-6">
        <section
          className="rounded-3xl overflow-hidden border"
          style={{
            background: surfaceBg,
            borderColor,
            boxShadow: "0 22px 48px rgba(15,23,42,0.14)",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-0">
            <div
              className="px-8 py-10 flex flex-col items-center text-center"
              style={{
                background: softSurfaceBg,
                borderRight: `1px solid ${borderColor}`,
              }}
            >
              <LabHeadAvatar
                photo={labHead.photo}
                name={labHead.name}
                size={220}
              />
              <div
                className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  background: "rgba(245,158,11,0.18)",
                  color: "#92400e",
                }}
              >
                Principal Investigator
              </div>
              <h1
                className="font-black text-2xl mt-3"
                style={{
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {labHead.name}
              </h1>
              {labHead.title && (
                <p
                  className="text-sm mt-1 font-semibold"
                  style={{ color: softText }}
                >
                  {labHead.title}
                </p>
              )}
              {labHead.department && (
                <p className="text-xs mt-1" style={{ color: softMuted }}>
                  {labHead.department}
                </p>
              )}

              {(labHead.email || labHead.phone) && (
                <div
                  className="mt-6 w-full rounded-2xl p-4 text-left"
                  style={{
                    background: surfaceBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <p
                    className="text-[11px] uppercase tracking-[0.18em] font-black mb-2"
                    style={{ color: softMuted }}
                  >
                    Quick Contact
                  </p>
                  {labHead.email && (
                    <a
                      href={`mailto:${labHead.email}`}
                      className="text-xs font-semibold inline-flex items-center gap-1.5 no-underline"
                      style={{ color: "var(--color-secondary)" }}
                    >
                      <AppIcon name="contact" size={13} /> {labHead.email}
                    </a>
                  )}
                  {labHead.phone && (
                    <p
                      className="text-xs inline-flex items-center gap-1.5 m-0 mt-2"
                      style={{ color: softText }}
                    >
                      <AppIcon name="phone" size={13} /> {labHead.phone}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="px-8 py-10">
              <p
                className="text-xs uppercase tracking-[0.2em] font-black"
                style={{ color: softMuted }}
              >
                Lab Head Profile
              </p>
              <h2
                className="text-3xl md:text-4xl font-black mt-2"
                style={{
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Vision, Leadership, and Research Direction
              </h2>
              <p
                className="text-sm mt-4 leading-relaxed max-w-3xl"
                style={{ color: softText }}
              >
                {labHead.fullBio || labHead.shortBio}
              </p>

              {interests.length > 0 && (
                <div className="mt-7">
                  <p
                    className="text-xs uppercase tracking-[0.2em] font-black"
                    style={{ color: softMuted }}
                  >
                    Research Interests
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <span
                        key={interest}
                        className="text-xs px-3 py-1.5 rounded-full font-semibold"
                        style={{
                          background: isDarkTheme
                            ? "rgba(37,99,235,0.2)"
                            : "rgba(37,99,235,0.1)",
                          color: isDarkTheme ? "#bfdbfe" : "#1d4ed8",
                          border: `1px solid ${isDarkTheme ? "rgba(59,130,246,0.35)" : "rgba(37,99,235,0.2)"}`,
                        }}
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: softSurfaceBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <p
                    className="text-[11px] uppercase tracking-[0.16em] font-black"
                    style={{ color: softMuted }}
                  >
                    Role
                  </p>
                  <p
                    className="text-sm font-bold mt-2"
                    style={{ color: softText }}
                  >
                    {labHead.title || "Lab Head"}
                  </p>
                </div>
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: softSurfaceBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <p
                    className="text-[11px] uppercase tracking-[0.16em] font-black"
                    style={{ color: softMuted }}
                  >
                    Focus
                  </p>
                  <p
                    className="text-sm font-bold mt-2"
                    style={{ color: softText }}
                  >
                    Interdisciplinary Research
                  </p>
                </div>
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: softSurfaceBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <p
                    className="text-[11px] uppercase tracking-[0.16em] font-black"
                    style={{ color: softMuted }}
                  >
                    Institution
                  </p>
                  <p
                    className="text-sm font-bold mt-2"
                    style={{ color: softText }}
                  >
                    {labHead.department || "Research Laboratory"}
                  </p>
                </div>
              </div>

              {links.length > 0 && (
                <div className="mt-8">
                  <p
                    className="text-xs uppercase tracking-[0.2em] font-black mb-3"
                    style={{ color: softMuted }}
                  >
                    Academic Profiles
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="no-underline rounded-xl px-3 py-2.5 text-sm font-bold flex items-center justify-between"
                        style={{
                          color: "#ffffff",
                          background: `linear-gradient(135deg, ${link.color}, ${theme.primaryColor})`,
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <AppIcon name={link.icon} size={14} />
                          {link.label}
                        </span>
                        <span style={{ opacity: 0.8 }}>Open</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            className="rounded-2xl border p-5"
            style={{ background: surfaceBg, borderColor }}
          >
            <p
              className="text-xs uppercase tracking-[0.18em] font-black"
              style={{ color: softMuted }}
            >
              Profile Summary
            </p>
            <p
              className="text-sm mt-3 leading-relaxed"
              style={{ color: softText }}
            >
              {labHead.shortBio || labHead.fullBio}
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{ background: surfaceBg, borderColor }}
          >
            <p
              className="text-xs uppercase tracking-[0.18em] font-black"
              style={{ color: softMuted }}
            >
              Contact and Outreach
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {labHead.email ? (
                <a
                  href={`mailto:${labHead.email}`}
                  className="no-underline text-sm font-semibold inline-flex items-center gap-2"
                  style={{ color: "var(--color-secondary)" }}
                >
                  <AppIcon name="contact" size={14} />
                  {labHead.email}
                </a>
              ) : (
                <p className="m-0 text-sm" style={{ color: softMuted }}>
                  Email not provided.
                </p>
              )}
              {labHead.phone ? (
                <p
                  className="m-0 text-sm inline-flex items-center gap-2"
                  style={{ color: softText }}
                >
                  <AppIcon name="phone" size={14} />
                  {labHead.phone}
                </p>
              ) : (
                <p className="m-0 text-sm" style={{ color: softMuted }}>
                  Phone not provided.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LabHead;
