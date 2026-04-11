import React, { useMemo, useState } from "react";
import PublicationCard from "../components/PublicationCard";
import { usePublications, useSiteContent } from "../firebase/hooks";
import type { Publication } from "../types";

function groupByYear(list: Publication[]): Record<number, Publication[]> {
  return list.reduce(
    (acc, p) => {
      acc[p.year] = acc[p.year] ? [...acc[p.year], p] : [p];
      return acc;
    },
    {} as Record<number, Publication[]>,
  );
}

const Publications: React.FC = () => {
  const { ongoing, published, loading } = usePublications();
  const { content } = useSiteContent();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "ongoing" | "published">("all");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  const allYears = useMemo(() => {
    const set = new Set([...ongoing, ...published].map((p) => p.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [ongoing, published]);

  const allTags = useMemo(() => {
    const set = new Set(
      [...ongoing, ...published].flatMap((p) => p.tags ?? []),
    );
    return Array.from(set).sort();
  }, [ongoing, published]);

  const filter = (list: Publication[]) =>
    list.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q) ||
        p.journal.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q));
      const matchYear = !selectedYear || String(p.year) === selectedYear;
      const matchTag = !selectedTag || p.tags?.includes(selectedTag);
      return matchSearch && matchYear && matchTag;
    });

  const filteredOngoing = filter(ongoing);
  const filteredPublished = filter(published);
  const groupedPublished = groupByYear(filteredPublished);
  const sortedYears = Object.keys(groupedPublished)
    .map(Number)
    .sort((a, b) => b - a);

  const hasFilters = !!(search || selectedYear || selectedTag);
  const clearFilters = () => {
    setSearch("");
    setSelectedYear("");
    setSelectedTag("");
  };

  const totalShown =
    (tab === "all" || tab === "ongoing" ? filteredOngoing.length : 0) +
    (tab === "all" || tab === "published" ? filteredPublished.length : 0);

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

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px",
    border: "none",
    borderBottom: active
      ? "2px solid var(--color-primary)"
      : "2px solid transparent",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    color: active ? "var(--color-primary)" : "#6b7280",
    background: "transparent",
    transition: "color 0.15s",
    whiteSpace: "nowrap",
  });

  const selectStyle: React.CSSProperties = {
    padding: "7px 28px 7px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    color: "#374151",
    background: "white",
    cursor: "pointer",
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
  };

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-20 text-center px-4"
        style={{ background: "var(--color-primary)" }}
      >
        {content["publications.bannerUrl"] && (
          <img
            src={content["publications.bannerUrl"]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.45)" }}
          />
        )}
        <div className="relative z-10">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative z-10">
            <h1
              className="font-black text-white mb-4"
              style={{
                fontSize: "clamp(2rem,4vw,3rem)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {content["publications.pageTitle"] ?? "Publications"}
            </h1>
            <p
              className="text-base max-w-xl mx-auto mb-6"
              style={{ color: "rgba(255,255,255,0.72)" }}
            >
              {content["publications.pageSubtitle"] ?? ""}
            </p>
            {/* Stats */}
            <div className="flex items-center justify-center gap-8">
              {[
                { value: published.length, label: "Published" },
                { value: ongoing.length, label: "Ongoing" },
                {
                  value: [
                    ...new Set(
                      [...ongoing, ...published].flatMap((p) => p.tags ?? []),
                    ),
                  ].length,
                  label: "Topics",
                },
              ].map((s, i, arr) => (
                <React.Fragment key={s.label}>
                  <div className="text-center">
                    <div
                      className="text-2xl font-black"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {s.value}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      {s.label}
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className="w-px h-8"
                      style={{ background: "rgba(255,255,255,0.2)" }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Filter bar */}
        <div
          className="bg-white rounded-xl p-3 mb-6 flex flex-wrap items-center gap-3"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <div className="relative flex-1" style={{ minWidth: 180 }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, author, journal..."
              className="w-full text-sm outline-none rounded-lg"
              style={{
                padding: "7px 12px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                fontSize: 13,
              }}
            />
          </div>
          {allYears.length > 1 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                ...selectStyle,
                borderColor: selectedYear ? "var(--color-primary)" : "#e2e8f0",
                color: selectedYear ? "var(--color-primary)" : "#374151",
              }}
            >
              <option value="">All Years</option>
              {allYears.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          )}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              style={{
                ...selectStyle,
                borderColor: selectedTag ? "var(--color-primary)" : "#e2e8f0",
                color: selectedTag ? "var(--color-primary)" : "#374151",
              }}
            >
              <option value="">All Topics</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold px-3 py-1.5 rounded border-none cursor-pointer"
              style={{ background: "#fee2e2", color: "#991b1b" }}
            >
              Clear ×
            </button>
          )}
          <span className="ml-auto text-xs" style={{ color: "#94a3b8" }}>
            {totalShown} result{totalShown !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b mb-8 overflow-x-auto"
          style={{ borderColor: "#e2e8f0" }}
        >
          <button style={tabStyle(tab === "all")} onClick={() => setTab("all")}>
            All ({filteredOngoing.length + filteredPublished.length})
          </button>
          <button
            style={tabStyle(tab === "ongoing")}
            onClick={() => setTab("ongoing")}
          >
            Ongoing ({filteredOngoing.length})
          </button>
          <button
            style={tabStyle(tab === "published")}
            onClick={() => setTab("published")}
          >
            Published ({filteredPublished.length})
          </button>
        </div>

        {/* Ongoing */}
        {(tab === "all" || tab === "ongoing") && filteredOngoing.length > 0 && (
          <div className="mb-12">
            <SectionHeader
              title={content["publications.ongoingTitle"] ?? "Ongoing Research"}
              subtitle={content["publications.ongoingSubtitle"]}
              count={filteredOngoing.length}
              accentColor="#d97706"
            />
            <div className="flex flex-col gap-3">
              {filteredOngoing.map((p) => (
                <PublicationCard key={p.id} publication={p} />
              ))}
            </div>
          </div>
        )}

        {/* Published — grouped by year */}
        {(tab === "all" || tab === "published") &&
          filteredPublished.length > 0 && (
            <div>
              <SectionHeader
                title={
                  content["publications.publishedTitle"] ?? "Published Research"
                }
                subtitle={content["publications.publishedSubtitle"]}
                count={filteredPublished.length}
                accentColor="var(--color-primary)"
              />
              {sortedYears.map((year) => (
                <YearGroup
                  key={year}
                  year={year}
                  publications={groupedPublished[year]}
                />
              ))}
            </div>
          )}

        {/* Empty */}
        {totalShown === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-base">No publications found.</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold px-5 py-2 rounded-lg text-white border-none cursor-pointer"
                style={{ background: "var(--color-primary)" }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Section heading ────────────────────────────────────────────
const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  count: number;
  accentColor: string;
}> = ({ title, subtitle, count, accentColor }) => (
  <div className="mb-5">
    <div className="flex items-center gap-2 mb-1">
      <div
        className="w-0.5 h-5 rounded-full flex-shrink-0"
        style={{ background: accentColor }}
      />
      <h2
        className="font-black text-lg"
        style={{
          color: "var(--color-primary)",
          fontFamily: "var(--font-heading)",
        }}
      >
        {title}
      </h2>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded"
        style={{ background: "#f1f5f9", color: "#475569" }}
      >
        {count}
      </span>
    </div>
    {subtitle && <p className="text-sm text-gray-500 ml-3">{subtitle}</p>}
  </div>
);

// ── Year group ─────────────────────────────────────────────────
const YearGroup: React.FC<{
  year: number;
  publications: Publication[];
}> = ({ year, publications }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-8">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-3 w-full text-left mb-3 bg-transparent border-none cursor-pointer"
      >
        <span
          className="text-sm font-black px-3 py-1 rounded"
          style={{ background: "var(--color-primary)", color: "white" }}
        >
          {year}
        </span>
        <span className="text-xs text-gray-400">
          {publications.length} paper{publications.length !== 1 ? "s" : ""}
        </span>
        <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
        <span className="text-xs text-gray-400">
          {collapsed ? "▼ show" : "▲ hide"}
        </span>
      </button>
      {!collapsed && (
        <div className="flex flex-col gap-3">
          {publications.map((p) => (
            <PublicationCard key={p.id} publication={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Publications;
