import React, { useState } from "react";
import { useThemeContext } from "../context/ThemeContext";
import type { Publication } from "../types";

interface Props {
  publication: Publication;
  onOpenDetails?: () => void;
}

const PublicationCard: React.FC<Props> = ({
  publication: p,
  onOpenDetails,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isOngoing = p.type === "ongoing";
  const { theme } = useThemeContext();

  const clean = theme.backgroundColor.replace("#", "").trim();
  const isDarkTheme =
    clean.length === 6
      ? (() => {
          const r = parseInt(clean.slice(0, 2), 16);
          const g = parseInt(clean.slice(2, 4), 16);
          const b = parseInt(clean.slice(4, 6), 16);
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          return luminance < 140;
        })()
      : false;

  const surfaceBg = isDarkTheme ? "#111827" : "white";
  const surfaceAltBg = isDarkTheme ? "#0f172a" : "#f8fafc";
  const borderColor = isDarkTheme ? "rgba(148,163,184,0.28)" : "#e8eef4";
  const mutedText = isDarkTheme ? "#94a3b8" : "#64748b";
  const subtleText = isDarkTheme ? "#cbd5e1" : "#475569";
  const titleColor = isDarkTheme ? "#f3f4f6" : "#0f172a";

  const createdTags = (p.tags ?? []).slice(0, 4).join("; ");

  const visibleTags = (p.tags ?? []).slice(0, 3);
  const extraTagCount = Math.max(0, (p.tags ?? []).length - visibleTags.length);

  return (
    <div
      className="rounded-xl"
      style={{
        background: surfaceBg,
        border: `1px solid ${borderColor}`,
        boxShadow: isDarkTheme
          ? "0 1px 2px rgba(0,0,0,0.35)"
          : "0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      <div className="p-5">
        <div className="mb-2 text-xs font-medium" style={{ color: mutedText }}>
          {isOngoing ? "Ongoing Research" : "Published Research"} · {p.year}
        </div>

        <h3
          className="font-bold text-lg leading-snug mb-2"
          style={{ color: titleColor, lineHeight: 1.4 }}
        >
          {!isOngoing && p.url ? (
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
              style={{ color: titleColor, textDecoration: "none" }}
            >
              {p.title}
            </a>
          ) : (
            p.title
          )}
        </h3>

        {p.authors && (
          <p className="text-sm mb-1" style={{ color: subtleText }}>
            {p.authors}
          </p>
        )}

        <div className="text-sm mb-1" style={{ color: subtleText }}>
          {p.journal && (
            <span>
              <em>{p.journal}</em>
            </span>
          )}
        </div>

        {p.doi && (
          <div className="text-sm mb-2" style={{ color: mutedText }}>
            DOI: {p.doi}
          </div>
        )}

        {createdTags && (
          <div className="text-xs mb-4" style={{ color: mutedText }}>
            Keywords: {createdTags}
            {extraTagCount > 0 ? `; +${extraTagCount} more` : ""}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {onOpenDetails && (
            <button
              onClick={onOpenDetails}
              className="text-sm font-semibold border-none cursor-pointer bg-transparent p-0"
              style={{ color: "var(--color-secondary)" }}
            >
              View details
            </button>
          )}
          {!isOngoing && p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="no-underline text-sm font-semibold"
              style={{
                color: "var(--color-secondary)",
              }}
            >
              View paper
            </a>
          )}
          {p.abstract && (
            <button
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="text-sm font-semibold border-none cursor-pointer bg-transparent p-0"
              style={{
                color: "var(--color-secondary)",
              }}
            >
              {expanded ? "Hide abstract" : "Show abstract"}
            </button>
          )}
        </div>

        {expanded && p.abstract && (
          <div
            className="mt-4 pt-4 text-sm leading-relaxed rounded p-4"
            style={{
              borderTop: `1px solid ${borderColor}`,
              background: surfaceAltBg,
              color: mutedText,
              lineHeight: 1.8,
            }}
          >
            <p
              className="font-semibold text-xs uppercase tracking-wider mb-2"
              style={{ color: mutedText }}
            >
              Abstract
            </p>
            <p style={{ whiteSpace: "pre-line" }}>{p.abstract}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicationCard;
