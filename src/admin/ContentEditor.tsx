import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import CloudinaryUpload from "../components/CloudinaryUpload";
import { db } from "../firebase/config";
import { useSiteContent } from "../firebase/hooks";
import type { CloudinaryUploadResult } from "../types";

// All editable fields grouped by tab
const FIELD_GROUPS = [
  {
    tab: "Home",
    fields: [
      { key: "home.heroTitle", label: "Hero Title", type: "text" },
      { key: "home.heroSubtitle", label: "Hero Subtitle", type: "text" },
      { key: "home.heroCta", label: "Hero CTA Button Text", type: "text" },
      {
        key: "home.bannerUrl",
        label: "Banner Image",
        type: "image",
        hint: "Recommended: 1600×600px, landscape",
      },
      {
        key: "home.introTitle",
        label: "Lab Intro Section Title",
        type: "text",
      },
      { key: "home.introText", label: "Lab Intro Text", type: "textarea" },
      {
        key: "home.announcementsTitle",
        label: "Announcements Section Title",
        type: "text",
      },
      {
        key: "home.statsLabel1",
        label: "Stats Label 1 (Collaborators)",
        type: "text",
      },
      {
        key: "home.statsLabel2",
        label: "Stats Label 2 (Publications)",
        type: "text",
      },
      {
        key: "home.statsLabel3",
        label: "Stats Label 3 (Ongoing)",
        type: "text",
      },
      { key: "home.statsLabel4", label: "Stats Label 4 (Ideas)", type: "text" },
    ],
  },
  {
    tab: "Lab Head",
    fields: [
      { key: "labhead.name", label: "Full Name", type: "text" },
      { key: "labhead.title", label: "Title / Position", type: "text" },
      {
        key: "labhead.department",
        label: "Department & University",
        type: "text",
      },
      {
        key: "labhead.photo",
        label: "Profile Photo",
        type: "image",
        hint: "Recommended: square, at least 400×400px",
      },
      {
        key: "labhead.shortBio",
        label: "Short Bio (shown on Home page)",
        type: "textarea",
      },
      {
        key: "labhead.fullBio",
        label: "Full Bio (shown on profile page)",
        type: "textarea",
      },
      { key: "labhead.email", label: "Email", type: "text" },
      { key: "labhead.phone", label: "Phone", type: "text" },
      { key: "labhead.linkedin", label: "LinkedIn URL", type: "text" },
      { key: "labhead.scholar", label: "Google Scholar URL", type: "text" },
      { key: "labhead.orcid", label: "ORCID URL", type: "text" },
      { key: "labhead.researchgate", label: "ResearchGate URL", type: "text" },
      {
        key: "labhead.researchInterests",
        label: "Research Interests (comma separated)",
        type: "text",
      },
    ],
  },
  {
    tab: "About",
    fields: [
      { key: "about.pageTitle", label: "Page Title", type: "text" },
      { key: "about.pageSubtitle", label: "Page Subtitle", type: "text" },
      { key: "about.section1Title", label: "Section 1 Title", type: "text" },
      { key: "about.section1Text", label: "Section 1 Text", type: "textarea" },
      { key: "about.section2Title", label: "Section 2 Title", type: "text" },
      { key: "about.section2Text", label: "Section 2 Text", type: "textarea" },
      { key: "about.section3Title", label: "Section 3 Title", type: "text" },
      { key: "about.section3Text", label: "Section 3 Text", type: "textarea" },
      { key: "about.missionTitle", label: "Mission Card Title", type: "text" },
      {
        key: "about.missionText",
        label: "Mission Card Text",
        type: "textarea",
      },
      { key: "about.visionTitle", label: "Vision Card Title", type: "text" },
      { key: "about.visionText", label: "Vision Card Text", type: "textarea" },
      {
        key: "about.bannerUrl",
        label: "Banner Image",
        type: "image",
        hint: "Recommended: 1600×400px, landscape",
      },
    ],
  },
  {
    tab: "Collaborators",
    fields: [
      { key: "collaborators.pageTitle", label: "Page Title", type: "text" },
      {
        key: "collaborators.pageSubtitle",
        label: "Page Subtitle",
        type: "text",
      },
      {
        key: "collaborators.requestTitle",
        label: "Join CTA Title",
        type: "text",
      },
      {
        key: "collaborators.requestSubtitle",
        label: "Join CTA Subtitle",
        type: "textarea",
      },
      {
        key: "collaborators.requestCta",
        label: "Join CTA Button Text",
        type: "text",
      },
      {
        key: "collaborators.bannerUrl",
        label: "Banner Image",
        type: "image",
        hint: "Recommended: 1600×400px, landscape",
      },
    ],
  },
  {
    tab: "Publications",
    fields: [
      { key: "publications.pageTitle", label: "Page Title", type: "text" },
      {
        key: "publications.pageSubtitle",
        label: "Page Subtitle",
        type: "text",
      },
      {
        key: "publications.ongoingTitle",
        label: "Ongoing Section Title",
        type: "text",
      },
      {
        key: "publications.ongoingSubtitle",
        label: "Ongoing Section Subtitle",
        type: "text",
      },
      {
        key: "publications.publishedTitle",
        label: "Published Section Title",
        type: "text",
      },
      {
        key: "publications.publishedSubtitle",
        label: "Published Section Subtitle",
        type: "text",
      },
      {
        key: "publications.bannerUrl",
        label: "Banner Image",
        type: "image",
        hint: "Recommended: 1600×400px, landscape",
      },
    ],
  },
  {
    tab: "Research Ideas",
    fields: [
      { key: "ideas.pageTitle", label: "Page Title", type: "text" },
      { key: "ideas.pageSubtitle", label: "Page Subtitle", type: "text" },
      { key: "ideas.postCta", label: "Post Button Text", type: "text" },
      { key: "ideas.emptyText", label: "Empty State Text", type: "text" },
      {
        key: "ideas.bannerUrl",
        label: "Banner Image",
        type: "image",
        hint: "Recommended: 1600×400px, landscape",
      },
    ],
  },
  {
    tab: "Gallery",
    fields: [
      { key: "gallery.pageTitle", label: "Page Title", type: "text" },
      { key: "gallery.pageSubtitle", label: "Page Subtitle", type: "text" },
      {
        key: "gallery.bannerUrl",
        label: "Banner Image",
        type: "image",
        hint: "Recommended: 1600×400px, landscape",
      },
    ],
  },
  {
    tab: "Contact",
    fields: [
      { key: "contact.pageTitle", label: "Page Title", type: "text" },
      { key: "contact.pageSubtitle", label: "Page Subtitle", type: "text" },
      { key: "contact.formTitle", label: "Form Section Title", type: "text" },
      { key: "contact.address", label: "Address", type: "textarea" },
      { key: "contact.email", label: "Contact Email", type: "text" },
      { key: "contact.phone", label: "Phone Number", type: "text" },
      { key: "contact.mapEmbed", label: "Google Maps Embed URL", type: "text" },
      {
        key: "contact.successMessage",
        label: "Form Success Message",
        type: "text",
      },
      {
        key: "contact.bannerUrl",
        label: "Banner Image",
        type: "image",
        hint: "Recommended: 1600×400px, landscape",
      },
    ],
  },
];

const ContentEditor: React.FC = () => {
  const { content } = useSiteContent();
  const [activeTab, setActiveTab] = useState("Home");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  // Sync values from Firestore content
  useEffect(() => {
    const safeContent = Object.fromEntries(
      Object.entries(content).filter(([, v]) => v !== undefined),
    ) as Record<string, string>;
    setValues((prev) => ({ ...safeContent, ...prev }));
  }, [content]);

  const saveField = async (key: string) => {
    setSaving((p) => ({ ...p, [key]: true }));
    try {
      await setDoc(
        doc(db, "siteContent", key),
        { value: values[key] ?? "" },
        { merge: true },
      );
      setSaved((p) => ({ ...p, [key]: true }));
      setTimeout(() => setSaved((p) => ({ ...p, [key]: false })), 2000);
    } finally {
      setSaving((p) => ({ ...p, [key]: false }));
    }
  };

  const saveAll = async (groupFields: (typeof FIELD_GROUPS)[0]["fields"]) => {
    for (const f of groupFields) {
      await saveField(f.key);
    }
  };

  const activeGroup = FIELD_GROUPS.find((g) => g.tab === activeTab)!;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-2xl font-black"
            style={{ color: "var(--color-primary)" }}
          >
            Content Editor
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Edit every text and image shown on the website. Changes go live
            instantly.
          </p>
        </div>
        <button
          onClick={() => saveAll(activeGroup.fields)}
          className="text-sm font-bold px-5 py-2.5 rounded-xl text-white"
          style={{
            background: "var(--color-primary)",
            border: "none",
            cursor: "pointer",
          }}
        >
          Save All ({activeTab})
        </button>
      </div>

      {/* Tab pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FIELD_GROUPS.map((g) => (
          <button
            key={g.tab}
            onClick={() => setActiveTab(g.tab)}
            className="text-sm font-bold px-4 py-2 rounded-xl border transition-colors"
            style={{
              background:
                activeTab === g.tab ? "var(--color-primary)" : "white",
              color: activeTab === g.tab ? "white" : "#374151",
              borderColor:
                activeTab === g.tab ? "var(--color-primary)" : "#e5e7eb",
              cursor: "pointer",
            }}
          >
            {g.tab}
            {g.tab === "Lab Head" && (
              <span
                className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--color-accent)", color: "#1f2937" }}
              >
                New
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-5">
        {activeGroup.fields.map((field) => (
          <div
            key={field.key}
            className="bg-white rounded-2xl p-5 shadow-sm border"
            style={{ borderColor: "#e5e7eb" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-bold text-gray-800">
                  {field.label}
                </label>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">
                  {field.key}
                </p>
              </div>
              <button
                onClick={() => saveField(field.key)}
                disabled={saving[field.key]}
                className="text-xs font-bold px-4 py-1.5 rounded-lg text-white disabled:opacity-60"
                style={{
                  background: saved[field.key]
                    ? "#22c55e"
                    : "var(--color-primary)",
                  border: "none",
                  cursor: "pointer",
                  minWidth: 70,
                }}
              >
                {saved[field.key]
                  ? "✓ Saved"
                  : saving[field.key]
                    ? "..."
                    : "Save"}
              </button>
            </div>

            {field.type === "image" ? (
              <div>
                <CloudinaryUpload
                  currentUrl={values[field.key]}
                  aspectHint={(field as any).hint}
                  onUpload={(r: CloudinaryUploadResult) => {
                    setValues((p) => ({ ...p, [field.key]: r.secure_url }));
                    setDoc(
                      doc(db, "siteContent", field.key),
                      { value: r.secure_url },
                      { merge: true },
                    );
                  }}
                />
                {/* Remove banner button */}
                {values[field.key] && (
                  <button
                    type="button"
                    onClick={() => {
                      setValues((p) => ({ ...p, [field.key]: "" }));
                      setDoc(
                        doc(db, "siteContent", field.key),
                        { value: "" },
                        { merge: true },
                      );
                    }}
                    className="mt-2 text-xs font-bold px-4 py-1.5 rounded-lg border-none cursor-pointer"
                    style={{ background: "#fee2e2", color: "#991b1b" }}
                  >
                    ✕ Remove Banner
                  </button>
                )}
              </div>
            ) : field.type === "textarea" ? (
              <textarea
                rows={5}
                value={values[field.key] ?? ""}
                onChange={(e) =>
                  setValues((p) => ({ ...p, [field.key]: e.target.value }))
                }
                className="w-full px-4 py-2.5 text-sm rounded-xl border outline-none"
                style={{
                  borderColor: "#e5e7eb",
                  resize: "vertical",
                  fontFamily: "var(--font-body)",
                }}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            ) : (
              <input
                type="text"
                value={values[field.key] ?? ""}
                onChange={(e) =>
                  setValues((p) => ({ ...p, [field.key]: e.target.value }))
                }
                className="w-full px-4 py-2.5 text-sm rounded-xl border outline-none"
                style={{ borderColor: "#e5e7eb" }}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentEditor;
