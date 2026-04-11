import { addDoc, collection } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import AppIcon, { type AppIconName } from "../components/AppIcon";
import CloudinaryUpload from "../components/CloudinaryUpload";
import CollaboratorCard from "../components/CollaboratorCard";
import { db } from "../firebase/config";
import { useCollaborators, useSiteContent } from "../firebase/hooks";
import type {
  CloudinaryUploadResult,
  CollaboratorProfile,
  CollaboratorPublication,
} from "../types";

const Collaborators: React.FC = () => {
  const { collaborators, loading } = useCollaborators();
  const { content } = useSiteContent();
  const [selected, setSelected] = useState<CollaboratorProfile | null>(null);
  const [showForm, setShowForm] = useState(false);

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
    return <CollaboratorDetail c={selected} onBack={() => setSelected(null)} />;

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

        {/* Join CTA */}
        <div className="bg-white rounded-2xl p-10 shadow-md text-center max-w-2xl mx-auto">
          <h2
            className="font-black text-2xl mb-3"
            style={{
              color: "var(--color-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {content["collaborators.requestTitle"] ?? "Become a Collaborator"}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            {content["collaborators.requestSubtitle"] ??
              "Interested in joining our research community? Submit a request and our admin will review your profile."}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="font-bold px-8 py-3 rounded-xl text-white text-sm"
            style={{
              background: "var(--color-primary)",
              border: "none",
              cursor: "pointer",
            }}
          >
            {content["collaborators.requestCta"] ?? "Submit Request"}
          </button>
        </div>
      </div>

      {showForm && <RequestModal onClose={() => setShowForm(false)} />}
    </div>
  );
};

// ── Full profile detail ────────────────────────────────────────
const CollaboratorDetail: React.FC<{
  c: CollaboratorProfile;
  onBack: () => void;
}> = ({ c, onBack }) => {
  const [imgErr, setImgErr] = useState(false);
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
          className="text-sm font-bold mb-8 bg-transparent border-none cursor-pointer"
          style={{ color: "var(--color-secondary)" }}
        >
          ← Back to Collaborators
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
            {c.publications?.length > 0 && (
              <>
                <h3
                  className="font-bold text-base mb-4"
                  style={{ color: "var(--color-primary)" }}
                >
                  Publications
                </h3>
                <div className="flex flex-col gap-3">
                  {c.publications.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl p-4 shadow-sm border-l-4"
                      style={{ borderColor: "var(--color-secondary)" }}
                    >
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-sm no-underline hover:underline"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {p.title}
                      </a>
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
            <div className="flex flex-col gap-2">
              {[
                {
                  href: c.linkedin,
                  label: "LinkedIn",
                  icon: "linkedin" as AppIconName,
                  color: "#0a66c2",
                },
                {
                  href: c.scholar,
                  label: "Google Scholar",
                  icon: "scholar" as AppIconName,
                  color: "#4285f4",
                },
                {
                  href: c.orcid,
                  label: "ORCID",
                  icon: "orcid" as AppIconName,
                  color: "#a6ce39",
                },
                {
                  href: c.researchgate,
                  label: "ResearchGate",
                  icon: "researchgate" as AppIconName,
                  color: "#00d2d3",
                },
                {
                  href: c.facebook,
                  label: "Facebook",
                  icon: "facebook" as AppIconName,
                  color: "#1877f2",
                },
              ]
                .filter((l) => l.href)
                .map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="no-underline font-bold text-sm px-4 py-2.5 rounded-lg text-white inline-flex items-center justify-center gap-2"
                    style={{ background: l.color }}
                  >
                    <AppIcon name={l.icon} size={14} />
                    {l.label}
                  </a>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Request Modal — NO password field ─────────────────────────
const emptyPub = (): CollaboratorPublication => ({
  id: Date.now().toString(),
  title: "",
  journal: "",
  year: new Date().getFullYear(),
  url: "",
});

const RequestModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    affiliation: "",
    designation: "",
    bio: "",
    photo: "",
    linkedin: "",
    orcid: "",
    scholar: "",
    researchgate: "",
    facebook: "",
    researchInterests: "",
  });
  const [publications, setPublications] = useState<CollaboratorPublication[]>([
    emptyPub(),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const f = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value })),
  });

  const updatePub = (
    i: number,
    k: keyof CollaboratorPublication,
    v: string | number,
  ) =>
    setPublications((ps) =>
      ps.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)),
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.bio) {
      setError("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "pendingRequests"), {
        ...form,
        researchInterests: form.researchInterests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        publications: publications.filter((p) => p.title),
        status: "pending",
        submittedAt: new Date().toISOString(),
      });
      setDone(true);
    } catch {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inp = "w-full px-3 py-2 text-sm rounded-lg border outline-none";
  const inpStyle = { borderColor: "#d1d5db" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: "var(--color-primary)" }}
        >
          <h2 className="text-white font-black text-lg">
            Collaborator Request
          </h2>
          <button
            onClick={onClose}
            className="text-white text-2xl bg-transparent border-none cursor-pointer leading-none"
          >
            ×
          </button>
        </div>

        {done ? (
          <div className="p-10 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3
              className="font-black text-xl mb-2"
              style={{ color: "var(--color-primary)" }}
            >
              Request Submitted!
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your application is under review. If approved, you will receive an
              email with your login credentials.
            </p>
            <button
              onClick={onClose}
              className="mt-6 font-bold px-6 py-2.5 rounded-lg text-white text-sm"
              style={{
                background: "var(--color-primary)",
                border: "none",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 flex flex-col gap-4">
            {/* Info notice — no password needed */}
            <div
              className="rounded-xl p-3 text-xs text-blue-700"
              style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <AppIcon name="about" size={12} />
                No password required. If your request is approved, you will
                receive an email with your login credentials.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <LabeledInput label="Full Name *">
                <input
                  required
                  className={inp}
                  style={inpStyle}
                  {...f("name")}
                  placeholder="Dr. Jane Smith"
                />
              </LabeledInput>
              <LabeledInput label="Email *">
                <input
                  required
                  type="email"
                  className={inp}
                  style={inpStyle}
                  {...f("email")}
                  placeholder="jane@buet.ac.bd"
                />
              </LabeledInput>
              <LabeledInput label="Designation *">
                <input
                  required
                  className={inp}
                  style={inpStyle}
                  {...f("designation")}
                  placeholder="Professor, PhD Student..."
                />
              </LabeledInput>
              <LabeledInput label="Affiliation *">
                <input
                  required
                  className={inp}
                  style={inpStyle}
                  {...f("affiliation")}
                  placeholder="BUET, Dept. of CSE"
                />
              </LabeledInput>
            </div>

            <CloudinaryUpload
              label="Profile Photo"
              currentUrl={form.photo}
              onUpload={(r: CloudinaryUploadResult) =>
                setForm((p) => ({ ...p, photo: r.secure_url }))
              }
            />

            <LabeledInput label="Bio *">
              <textarea
                required
                rows={4}
                className={inp}
                style={{ ...inpStyle, resize: "vertical" }}
                {...f("bio")}
                placeholder="Brief description of your background..."
              />
            </LabeledInput>

            <LabeledInput label="Research Interests (comma separated)">
              <input
                className={inp}
                style={inpStyle}
                {...f("researchInterests")}
                placeholder="Machine Learning, NLP, Computer Vision"
              />
            </LabeledInput>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  "linkedin",
                  "orcid",
                  "scholar",
                  "researchgate",
                  "facebook",
                ] as const
              ).map((k) => (
                <LabeledInput
                  key={k}
                  label={k.charAt(0).toUpperCase() + k.slice(1)}
                >
                  <input
                    className={inp}
                    style={inpStyle}
                    {...f(k)}
                    placeholder="https://..."
                  />
                </LabeledInput>
              ))}
            </div>

            {/* Publications */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Publications
                </label>
                <button
                  type="button"
                  onClick={() => setPublications((p) => [...p, emptyPub()])}
                  className="text-xs font-bold bg-transparent border-none cursor-pointer"
                  style={{ color: "var(--color-secondary)" }}
                >
                  + Add
                </button>
              </div>
              {publications.map((pub, i) => (
                <div key={pub.id} className="grid grid-cols-4 gap-2 mb-2">
                  <input
                    className={`${inp} col-span-2`}
                    style={inpStyle}
                    placeholder="Title"
                    value={pub.title}
                    onChange={(e) => updatePub(i, "title", e.target.value)}
                  />
                  <input
                    className={inp}
                    style={inpStyle}
                    placeholder="Journal"
                    value={pub.journal}
                    onChange={(e) => updatePub(i, "journal", e.target.value)}
                  />
                  <input
                    className={inp}
                    style={inpStyle}
                    placeholder="Year"
                    type="number"
                    value={pub.year}
                    onChange={(e) => updatePub(i, "year", +e.target.value)}
                  />
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-semibold px-5 py-2 rounded-lg border cursor-pointer"
                style={{
                  borderColor: "#d1d5db",
                  background: "white",
                  color: "#374151",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="text-sm font-bold px-6 py-2 rounded-lg text-white disabled:opacity-60"
                style={{
                  background: "var(--color-primary)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const LabeledInput: React.FC<{
  label: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, children, className }) => (
  <div className={className}>
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {label}
    </label>
    {children}
  </div>
);

export default Collaborators;
