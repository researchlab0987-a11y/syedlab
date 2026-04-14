import React, { useMemo, useState } from "react";
import CollaboratorCard from "../components/CollaboratorCard";
import CollaboratorProfileDetail from "../components/CollaboratorProfileDetail";
import CollaboratorRequestForm from "../components/CollaboratorRequestForm";
import {
  useCollaborators,
  usePublications,
  useSiteContent,
} from "../firebase/hooks";
import type { CollaboratorProfile, CollaboratorPublication } from "../types";

const Collaborators: React.FC = () => {
  const { collaborators, loading } = useCollaborators();
  const { ongoing, published } = usePublications();
  const { content } = useSiteContent();
  const [selected, setSelected] = useState<CollaboratorProfile | null>(null);

  const [designationFilter, setDesignationFilter] = useState("");
  const [affiliationFilter, setAffiliationFilter] = useState("");
  const [search, setSearch] = useState("");

  const designationOptions = useMemo(() => {
    const set = new Set(
      collaborators.map((c) => c.designation?.trim()).filter(Boolean),
    );
    return Array.from(set).sort();
  }, [collaborators]);

  const affiliationOptions = useMemo(() => {
    const set = new Set(
      collaborators.map((c) => c.affiliation?.trim()).filter(Boolean),
    );
    return Array.from(set).sort();
  }, [collaborators]);

  const filtered = useMemo(() => {
    return collaborators.filter((c) => {
      const matchDesignation =
        !designationFilter || c.designation?.trim() === designationFilter;
      const matchAffiliation =
        !affiliationFilter || c.affiliation?.trim() === affiliationFilter;
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.affiliation?.toLowerCase().includes(search.toLowerCase()) ||
        c.designation?.toLowerCase().includes(search.toLowerCase()) ||
        c.researchInterests?.some((r) =>
          r.toLowerCase().includes(search.toLowerCase()),
        );
      return matchDesignation && matchAffiliation && matchSearch;
    });
  }, [collaborators, designationFilter, affiliationFilter, search]);

  const hasActiveFilter = !!(designationFilter || affiliationFilter || search);
  const clearFilters = () => {
    setDesignationFilter("");
    setAffiliationFilter("");
    setSearch("");
  };

  const linkedPublicationsByUid = useMemo(() => {
    const map = new Map<string, CollaboratorPublication[]>();
    const allPublications = [...ongoing, ...published];

    allPublications.forEach((pub) => {
      const linkedUids = new Set<string>();
      (pub.contributorUids ?? []).forEach((uid) => {
        if (uid) linkedUids.add(uid);
      });
      (pub.authorEntries ?? []).forEach((author) => {
        if (author.type === "linked" && author.uid) linkedUids.add(author.uid);
      });

      if (!linkedUids.size) return;

      const normalized: CollaboratorPublication = {
        id: pub.id,
        title: pub.title,
        journal: pub.journal,
        year: pub.year,
        url: pub.url,
      };

      linkedUids.forEach((uid) => {
        const existing = map.get(uid) ?? [];
        const alreadyExists = existing.some((item) => {
          const sameId = item.id && item.id === normalized.id;
          const sameSignature =
            item.title.trim().toLowerCase() ===
              normalized.title.trim().toLowerCase() &&
            item.year === normalized.year &&
            (item.url ?? "").trim().toLowerCase() ===
              (normalized.url ?? "").trim().toLowerCase();
          return sameId || sameSignature;
        });
        if (!alreadyExists) {
          map.set(uid, [...existing, normalized]);
        }
      });
    });

    map.forEach((items, uid) => {
      map.set(
        uid,
        [...items].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)),
      );
    });

    return map;
  }, [ongoing, published]);

  const selectedLinkedPublications = selected
    ? (linkedPublicationsByUid.get(selected.uid) ?? [])
    : [];

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

  if (selected)
    return (
      <CollaboratorProfileDetail
        c={selected}
        linkedPublications={selectedLinkedPublications}
        onBack={() => setSelected(null)}
      />
    );

  const selectStyle: React.CSSProperties = {
    padding: "9px 36px 9px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    background: "white",
    cursor: "pointer",
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    minWidth: 180,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  };

  const activeSelectStyle: React.CSSProperties = {
    ...selectStyle,
    borderColor: "var(--color-primary)",
    color: "var(--color-primary)",
    background: "#eff6ff",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231e3a5f' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
  };

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-20 text-center px-4"
        style={{ background: "var(--color-primary)" }}
      >
        {content["collaborators.bannerUrl"] && (
          <img
            src={content["collaborators.bannerUrl"]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.45)" }}
          />
        )}
        <div className="relative z-10">
          <h1
            className="font-black text-white mb-4"
            style={{
              fontSize: "clamp(2rem,4vw,3rem)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {content["collaborators.pageTitle"] ?? "Our Collaborators"}
          </h1>
          <p
            className="text-base max-w-xl mx-auto"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            {content["collaborators.pageSubtitle"] ?? ""}
          </p>
          <button
            onClick={() => {
              document
                .getElementById("collaborator-request")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="mt-6 font-bold px-8 py-3 rounded-xl text-sm"
            style={{
              background: "var(--color-accent)",
              color: "#1f2937",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            }}
          >
            {content["collaborators.requestCta"] ?? "Become a Collaborator"}
          </button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filter Bar */}
        {collaborators.length > 0 && (
          <div
            className="bg-white rounded-2xl p-4 mb-8 flex flex-wrap items-center gap-3"
            style={{
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              border: "1px solid #f0f0f0",
            }}
          >
            <div className="relative flex-1" style={{ minWidth: 200 }}>
              <span
                className="absolute left-3 top-1/2 text-gray-400 text-sm"
                style={{ transform: "translateY(-50%)" }}
              >
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, university, interest..."
                className="w-full text-sm outline-none rounded-xl"
                style={{
                  padding: "9px 14px 9px 34px",
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              />
            </div>
            <select
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              style={designationFilter ? activeSelectStyle : selectStyle}
            >
              <option value="">All Designations</option>
              {designationOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={affiliationFilter}
              onChange={(e) => setAffiliationFilter(e.target.value)}
              style={affiliationFilter ? activeSelectStyle : selectStyle}
            >
              <option value="">All Universities</option>
              {affiliationOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="text-xs font-bold px-4 py-2 rounded-xl border-none cursor-pointer"
                style={{ background: "#fee2e2", color: "#991b1b" }}
              >
                ✕ Clear
              </button>
            )}
            <div
              className="ml-auto text-xs font-semibold"
              style={{ color: "#9ca3af" }}
            >
              {filtered.length} of {collaborators.length} shown
            </div>
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 font-semibold text-lg">
              No collaborators match your filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm font-bold px-5 py-2.5 rounded-xl border-none cursor-pointer text-white"
              style={{ background: "var(--color-primary)" }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
            {filtered.map((c) => (
              <CollaboratorCard
                key={c.id}
                collaborator={c}
                onClick={() => setSelected(c)}
              />
            ))}
          </div>
        )}
      </div>

      <section
        id="collaborator-request"
        className="px-4 py-14"
        style={{
          background: "#f8fafc",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-7">
            <p
              className="text-xs font-black uppercase tracking-[0.18em]"
              style={{ color: "#64748b" }}
            >
              Join the Network
            </p>
            <div
              className="mx-auto mt-2 h-1 w-14 rounded-full"
              style={{ background: "var(--color-accent)" }}
            />
          </div>
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-md max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2
                className="font-black text-2xl mb-3"
                style={{
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {content["collaborators.requestTitle"] ??
                  "Become a Collaborator"}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {content["collaborators.requestSubtitle"] ??
                  "Interested in joining our research community? Submit your request below and our admin will review your profile."}
              </p>
            </div>
            <CollaboratorRequestForm />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Collaborators;
