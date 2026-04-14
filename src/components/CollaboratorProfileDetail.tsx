import React, { useMemo, useState } from "react";
import type { CollaboratorProfile, CollaboratorPublication } from "../types";
import AppIcon, { type AppIconName } from "./AppIcon";

const CollaboratorProfileDetail: React.FC<{
  c: CollaboratorProfile;
  linkedPublications: CollaboratorPublication[];
  onBack: () => void;
}> = ({ c, linkedPublications, onBack }) => {
  const [imgErr, setImgErr] = useState(false);
  const mergedPublications = useMemo(() => {
    const all = [...(c.publications ?? []), ...linkedPublications];
    const seen = new Set<string>();

    const unique = all.filter((item) => {
      const key = `${item.id ?? ""}::${item.title.trim().toLowerCase()}::${
        item.year ?? 0
      }::${(item.url ?? "").trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  }, [c.publications, linkedPublications]);

  const initials = c.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      <div
        className="py-16 px-4 text-center"
        style={{ background: "var(--color-primary)" }}
      >
        {c.photo && !imgErr ? (
          <img
            src={c.photo}
            alt={c.name}
            onError={() => setImgErr(true)}
            className="w-32 h-32 rounded-full object-cover border-4 border-white mx-auto mb-4"
          />
        ) : (
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-black border-4 border-white mx-auto mb-4"
            style={{ background: "var(--color-secondary)" }}
          >
            {initials}
          </div>
        )}
        <h1 className="text-white font-black text-3xl">{c.name}</h1>
        <p
          className="mt-1"
          style={{ color: "var(--color-accent)", fontWeight: 700 }}
        >
          {c.designation}
        </p>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
          {c.affiliation}
        </p>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm shadow-sm border bg-white hover:bg-gray-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          style={{
            borderColor: "var(--color-navbar)",
            color: "var(--color-primary)",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            width: "fit-content",
          }}
        >
          <AppIcon name="back" size={18} style={{ marginRight: 2 }} />
          Back to Collaborators
        </button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-2">
            <h2
              className="font-black text-xl mb-3"
              style={{ color: "var(--color-primary)" }}
            >
              About
            </h2>
            <p
              className="text-gray-700 leading-relaxed mb-8"
              style={{ whiteSpace: "pre-line" }}
            >
              {c.bio}
            </p>
            {c.researchInterests?.length > 0 && (
              <>
                <h3
                  className="font-bold text-base mb-3"
                  style={{ color: "var(--color-primary)" }}
                >
                  Research Interests
                </h3>
                <div className="flex flex-wrap gap-2 mb-8">
                  {c.researchInterests.map((r) => (
                    <span
                      key={r}
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{ background: "#eff6ff", color: "#1d4ed8" }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </>
            )}
            {mergedPublications.length > 0 && (
              <>
                <h3
                  className="font-bold text-base mb-4"
                  style={{ color: "var(--color-primary)" }}
                >
                  Publications
                </h3>
                <div className="flex flex-col gap-3">
                  {mergedPublications.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl p-4 shadow-sm border-l-4"
                      style={{ borderColor: "var(--color-secondary)" }}
                    >
                      {p.url ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-sm no-underline hover:underline"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {p.title}
                        </a>
                      ) : (
                        <p
                          className="font-bold text-sm"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {p.title}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {p.journal} · {p.year}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div>
            <h3
              className="font-bold text-base mb-4"
              style={{ color: "var(--color-primary)" }}
            >
              Links
            </h3>
            <div className="flex flex-row gap-3">
              {[
                {
                  href: c.linkedin,
                  label: "LinkedIn",
                  icon: "linkedin" as AppIconName,
                },
                {
                  href: c.scholar,
                  label: "Google Scholar",
                  icon: "scholar" as AppIconName,
                },
                {
                  href: c.orcid,
                  label: "ORCID",
                  icon: "orcid" as AppIconName,
                },
                {
                  href: c.researchgate,
                  label: "ResearchGate",
                  icon: "researchgate" as AppIconName,
                },
                {
                  href: c.facebook,
                  label: "Facebook",
                  icon: "facebook" as AppIconName,
                },
              ]
                .filter((l) => l.href)
                .map((l) => (
                  <div
                    key={l.label}
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="no-underline flex items-center justify-center"
                      style={{
                        width: 38,
                        height: 38,
                        background: "#fff",
                        border: "1px solid #111827",
                        borderRadius: 8,
                        color: "#111827",
                        filter: "grayscale(1)",
                        transition: "box-shadow 0.2s, transform 0.2s",
                        boxShadow: "0 2px 10px rgba(17,24,39,0.05)",
                        position: "relative",
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(-2px)";
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          "0 4px 12px rgba(17,24,39,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(0)";
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          "0 2px 10px rgba(17,24,39,0.05)";
                      }}
                    >
                      <AppIcon name={l.icon} size={18} />
                    </a>
                    <span
                      style={{
                        visibility: "hidden",
                        opacity: 0,
                        position: "absolute",
                        left: "50%",
                        top: "110%",
                        transform: "translateX(-50%)",
                        background: "#222",
                        color: "#fff",
                        padding: "3px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        zIndex: 10,
                        transition: "opacity 0.15s",
                        pointerEvents: "none",
                      }}
                      className="social-label"
                    >
                      {l.label}
                    </span>
                    <style>{`
                      a:hover + .social-label {
                        visibility: visible !important;
                        opacity: 1 !important;
                      }
                    `}</style>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorProfileDetail;
