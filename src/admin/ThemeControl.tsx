import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { db } from "../firebase/config";
import { useTheme } from "../firebase/hooks";
import type { ThemeSettings } from "../types";

const FONTS = [
  "'Inter', sans-serif",
  "'Roboto', sans-serif",
  "'Poppins', sans-serif",
  "'Merriweather', serif",
  "'Playfair Display', serif",
  "'Source Sans 3', sans-serif",
  "'Lato', sans-serif",
  "'Nunito', sans-serif",
];

const PRESETS: { name: string; settings: ThemeSettings }[] = [
  {
    name: "Midnight Dark",
    settings: {
      primaryColor: "#0f172a",
      secondaryColor: "#38bdf8",
      accentColor: "#f59e0b",
      backgroundColor: "#0b1220",
      navbarColor: "#020617",
      footerColor: "#020617",
      fontFamily: "'Inter', sans-serif",
      headingFont: "'Inter', sans-serif",
    },
  },
  {
    name: "Notice Board Crimson",
    settings: {
      primaryColor: "#991b1b",
      secondaryColor: "#b91c1c",
      accentColor: "#fbbf24",
      backgroundColor: "#f8f6f3",
      navbarColor: "#111827",
      footerColor: "#111827",
      fontFamily: "'Lato', sans-serif",
      headingFont: "'Poppins', sans-serif",
    },
  },
  {
    name: "Club Maroon Formal",
    settings: {
      primaryColor: "#7f1d1d",
      secondaryColor: "#9f1239",
      accentColor: "#d4af37",
      backgroundColor: "#f7f4ef",
      navbarColor: "#1f2937",
      footerColor: "#111827",
      fontFamily: "'Source Sans 3', sans-serif",
      headingFont: "'Merriweather', serif",
    },
  },
  {
    name: "Scarlet Carbon",
    settings: {
      primaryColor: "#0f172a",
      secondaryColor: "#dc2626",
      accentColor: "#f59e0b",
      backgroundColor: "#f3f4f6",
      navbarColor: "#111827",
      footerColor: "#020617",
      fontFamily: "'Inter', sans-serif",
      headingFont: "'Poppins', sans-serif",
    },
  },
  {
    name: "Grand Hall Burgundy",
    settings: {
      primaryColor: "#6b0f1a",
      secondaryColor: "#a4161a",
      accentColor: "#ffd166",
      backgroundColor: "#faf8f5",
      navbarColor: "#2b2d42",
      footerColor: "#1a1f2f",
      fontFamily: "'Lato', sans-serif",
      headingFont: "'Playfair Display', serif",
    },
  },
  {
    name: "Obsidian Gold",
    settings: {
      primaryColor: "#111827",
      secondaryColor: "#d4af37",
      accentColor: "#f59e0b",
      backgroundColor: "#0b0f19",
      navbarColor: "#030712",
      footerColor: "#030712",
      fontFamily: "'Inter', sans-serif",
      headingFont: "'Playfair Display', serif",
    },
  },
  {
    name: "Graphite Cyan",
    settings: {
      primaryColor: "#0b1324",
      secondaryColor: "#06b6d4",
      accentColor: "#22d3ee",
      backgroundColor: "#0a1222",
      navbarColor: "#020817",
      footerColor: "#020817",
      fontFamily: "'Source Sans 3', sans-serif",
      headingFont: "'Poppins', sans-serif",
    },
  },
  {
    name: "Nordic Aurora",
    settings: {
      primaryColor: "#1f2937",
      secondaryColor: "#4f46e5",
      accentColor: "#14b8a6",
      backgroundColor: "#eef2ff",
      navbarColor: "#1f2937",
      footerColor: "#111827",
      fontFamily: "'Nunito', sans-serif",
      headingFont: "'Nunito', sans-serif",
    },
  },
  {
    name: "Arctic Glass",
    settings: {
      primaryColor: "#1e3a8a",
      secondaryColor: "#0ea5e9",
      accentColor: "#f97316",
      backgroundColor: "#f8fafc",
      navbarColor: "#1e3a8a",
      footerColor: "#0f172a",
      fontFamily: "'Inter', sans-serif",
      headingFont: "'Inter', sans-serif",
    },
  },
  {
    name: "Emerald Luxe",
    settings: {
      primaryColor: "#14532d",
      secondaryColor: "#059669",
      accentColor: "#f59e0b",
      backgroundColor: "#ecfdf5",
      navbarColor: "#14532d",
      footerColor: "#052e16",
      fontFamily: "'Poppins', sans-serif",
      headingFont: "'Merriweather', serif",
    },
  },
  {
    name: "Terracotta Journal",
    settings: {
      primaryColor: "#7c2d12",
      secondaryColor: "#ea580c",
      accentColor: "#fbbf24",
      backgroundColor: "#fff7ed",
      navbarColor: "#7c2d12",
      footerColor: "#431407",
      fontFamily: "'Lato', sans-serif",
      headingFont: "'Playfair Display', serif",
    },
  },
  {
    name: "Royal Amethyst",
    settings: {
      primaryColor: "#312e81",
      secondaryColor: "#7c3aed",
      accentColor: "#f472b6",
      backgroundColor: "#f5f3ff",
      navbarColor: "#312e81",
      footerColor: "#1e1b4b",
      fontFamily: "'Nunito', sans-serif",
      headingFont: "'Nunito', sans-serif",
    },
  },
  {
    name: "Sapphire Sand",
    settings: {
      primaryColor: "#0f2a43",
      secondaryColor: "#2563eb",
      accentColor: "#f59e0b",
      backgroundColor: "#f8f5f0",
      navbarColor: "#0f2a43",
      footerColor: "#0b1f33",
      fontFamily: "'Source Sans 3', sans-serif",
      headingFont: "'Merriweather', serif",
    },
  },
  {
    name: "Rosewood Noir",
    settings: {
      primaryColor: "#2a0f1f",
      secondaryColor: "#be185d",
      accentColor: "#fb7185",
      backgroundColor: "#120711",
      navbarColor: "#0b0610",
      footerColor: "#0b0610",
      fontFamily: "'Lato', sans-serif",
      headingFont: "'Playfair Display', serif",
    },
  },
  {
    name: "Navy Blue (Default)",
    settings: {
      primaryColor: "#1e3a5f",
      secondaryColor: "#2563eb",
      accentColor: "#f59e0b",
      backgroundColor: "#f8fafc",
      navbarColor: "#1e3a5f",
      footerColor: "#111827",
      fontFamily: "'Inter', sans-serif",
      headingFont: "'Inter', sans-serif",
    },
  },
  {
    name: "Forest Green",
    settings: {
      primaryColor: "#14532d",
      secondaryColor: "#16a34a",
      accentColor: "#facc15",
      backgroundColor: "#f0fdf4",
      navbarColor: "#14532d",
      footerColor: "#052e16",
      fontFamily: "'Poppins', sans-serif",
      headingFont: "'Poppins', sans-serif",
    },
  },
  {
    name: "Royal Purple",
    settings: {
      primaryColor: "#3b0764",
      secondaryColor: "#7c3aed",
      accentColor: "#f472b6",
      backgroundColor: "#faf5ff",
      navbarColor: "#3b0764",
      footerColor: "#1e1b4b",
      fontFamily: "'Nunito', sans-serif",
      headingFont: "'Nunito', sans-serif",
    },
  },
  {
    name: "Crimson",
    settings: {
      primaryColor: "#7f1d1d",
      secondaryColor: "#dc2626",
      accentColor: "#fbbf24",
      backgroundColor: "#fff5f5",
      navbarColor: "#7f1d1d",
      footerColor: "#1c0a0a",
      fontFamily: "'Lato', sans-serif",
      headingFont: "'Playfair Display', serif",
    },
  },
  {
    name: "Slate & Teal",
    settings: {
      primaryColor: "#0f172a",
      secondaryColor: "#0d9488",
      accentColor: "#f97316",
      backgroundColor: "#f8fafc",
      navbarColor: "#0f172a",
      footerColor: "#020617",
      fontFamily: "'Source Sans 3', sans-serif",
      headingFont: "'Source Sans 3', sans-serif",
    },
  },
];

const COLOR_FIELDS: { key: keyof ThemeSettings; label: string }[] = [
  { key: "primaryColor", label: "Primary Color" },
  { key: "secondaryColor", label: "Secondary / Link Color" },
  { key: "accentColor", label: "Accent Color" },
  { key: "backgroundColor", label: "Page Background" },
  { key: "navbarColor", label: "Navbar Color" },
  { key: "footerColor", label: "Footer Color" },
];

const ThemeControl: React.FC = () => {
  const currentTheme = useTheme();
  const [theme, setTheme] = useState<ThemeSettings>(currentTheme);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  const applyTheme = async (t: ThemeSettings) => {
    setSaving(true);
    try {
      await setDoc(doc(db, "theme", "settings"), t);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-2xl font-black"
            style={{ color: "var(--color-primary)" }}
          >
            Theme Control
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Changes apply globally to the entire website in real time.
          </p>
        </div>
        <button
          onClick={() => applyTheme(theme)}
          disabled={saving}
          className="text-sm font-bold px-5 py-2.5 rounded-xl text-white disabled:opacity-60"
          style={{
            background: saved ? "#22c55e" : "var(--color-primary)",
            border: "none",
            cursor: "pointer",
          }}
        >
          {saved ? "✓ Applied!" : saving ? "Applying..." : "Apply Theme"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Custom Colors */}
        <div
          className="bg-white rounded-2xl p-6 shadow-sm border"
          style={{ borderColor: "#e5e7eb" }}
        >
          <h3 className="font-bold text-base mb-5 text-gray-800">
            Custom Colors
          </h3>
          <div className="flex flex-col gap-4">
            {COLOR_FIELDS.map((f) => (
              <div key={f.key} className="flex items-center gap-4">
                <input
                  type="color"
                  value={theme[f.key] as string}
                  onChange={(e) =>
                    setTheme((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  className="rounded-lg border cursor-pointer flex-shrink-0"
                  style={{
                    width: 48,
                    height: 40,
                    borderColor: "#d1d5db",
                    padding: 2,
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">
                    {f.label}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {theme[f.key] as string}
                  </p>
                </div>
                {/* Swatch preview */}
                <div
                  className="rounded-lg border"
                  style={{
                    width: 40,
                    height: 40,
                    background: theme[f.key] as string,
                    borderColor: "#e5e7eb",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Font pickers */}
          <div
            className="mt-6 pt-5 border-t"
            style={{ borderColor: "#e5e7eb" }}
          >
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Fonts</h4>
            {(["fontFamily", "headingFont"] as const).map((fk) => (
              <div key={fk} className="mb-3">
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                  {fk === "fontFamily" ? "Body Font" : "Heading Font"}
                </label>
                <select
                  value={theme[fk]}
                  onChange={(e) =>
                    setTheme((p) => ({ ...p, [fk]: e.target.value }))
                  }
                  className="w-full text-sm px-3 py-2 rounded-lg border outline-none"
                  style={{ borderColor: "#d1d5db", fontFamily: theme[fk] }}
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>
                      {f.replace(/'/g, "").split(",")[0]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div
          className="bg-white rounded-2xl p-6 shadow-sm border"
          style={{ borderColor: "#e5e7eb" }}
        >
          <h3 className="font-bold text-base mb-5 text-gray-800">
            Preset Palettes
          </h3>
          <div className="flex flex-col gap-3">
            {PRESETS.map((p) => (
              <div
                key={p.name}
                onClick={() => {
                  setTheme(p.settings);
                  applyTheme(p.settings);
                }}
                className="flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-colors"
                style={{ borderColor: "#e5e7eb" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f8fafc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "white")
                }
              >
                {/* Swatches */}
                <div className="flex gap-1.5">
                  {[
                    p.settings.primaryColor,
                    p.settings.secondaryColor,
                    p.settings.accentColor,
                  ].map((c) => (
                    <div
                      key={c}
                      className="rounded-full border"
                      style={{
                        width: 22,
                        height: 22,
                        background: c,
                        borderColor: "#e5e7eb",
                      }}
                    />
                  ))}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">{p.name}</p>
                  <p
                    className="text-xs text-gray-400"
                    style={{ fontFamily: p.settings.fontFamily }}
                  >
                    {p.settings.fontFamily.replace(/'/g, "").split(",")[0]}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-secondary)" }}
                >
                  Apply →
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Preview Strip */}
      <div
        className="mt-8 bg-white rounded-2xl p-6 shadow-sm border"
        style={{ borderColor: "#e5e7eb" }}
      >
        <h3 className="font-bold text-base mb-4 text-gray-800">Live Preview</h3>
        <div
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: "#e5e7eb" }}
        >
          {/* Mini navbar */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ background: theme.navbarColor }}
          >
            <span
              className="font-black text-sm"
              style={{ color: "white", fontFamily: theme.headingFont }}
            >
              <span style={{ color: theme.accentColor }}>Rahman</span> Lab
            </span>
            <div className="flex gap-3">
              {["Home", "About", "Contact"].map((l) => (
                <span
                  key={l}
                  className="text-xs"
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: theme.fontFamily,
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
          {/* Mini body */}
          <div className="p-5" style={{ background: theme.backgroundColor }}>
            <h2
              className="font-black text-lg mb-2"
              style={{
                color: theme.primaryColor,
                fontFamily: theme.headingFont,
              }}
            >
              Sample Heading
            </h2>
            <p
              className="text-sm text-gray-600 mb-3"
              style={{ fontFamily: theme.fontFamily }}
            >
              This is how your body text will look with the selected theme
              settings.
            </p>
            <div className="flex gap-3">
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                style={{ background: theme.primaryColor }}
              >
                Primary Button
              </span>
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                style={{ background: theme.secondaryColor }}
              >
                Secondary
              </span>
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-lg text-gray-800"
                style={{ background: theme.accentColor }}
              >
                Accent
              </span>
            </div>
          </div>
          {/* Mini footer */}
          <div
            className="px-5 py-3 text-xs text-center"
            style={{
              background: theme.footerColor,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Footer — Rahman Research Lab
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeControl;
