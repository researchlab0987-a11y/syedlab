import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import React, { useState } from "react";
import AppIcon from "../components/AppIcon";
import CloudinaryUpload from "../components/CloudinaryUpload";
import { db } from "../firebase/config";
import { useGallery } from "../firebase/hooks";
import type { CloudinaryUploadResult, GalleryItem } from "../types";

// ── Empty form state ───────────────────────────────────────────
const emptyForm = () => ({ title: "", description: "", imageUrl: "" });

const ManageGallery: React.FC = () => {
  const { gallery, loading } = useGallery();
  const [modal, setModal] = useState<{
    mode: "add" | "edit";
    data: Partial<GalleryItem>;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Save (add or edit) ───────────────────────────────────────
  const save = async () => {
    if (!modal) return;
    if (!modal.data.title?.trim()) {
      alert("Please enter a title.");
      return;
    }
    if (!modal.data.imageUrl?.trim()) {
      alert("Please upload or paste an image URL.");
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === "add") {
        const maxOrder = gallery.reduce((m, g) => Math.max(m, g.order ?? 0), 0);
        await addDoc(collection(db, "gallery"), {
          title: modal.data.title.trim(),
          description: modal.data.description?.trim() ?? "",
          imageUrl: modal.data.imageUrl.trim(),
          order: maxOrder + 1,
          createdAt: new Date().toISOString(),
        });
      } else {
        const { id, ...data } = modal.data as GalleryItem;
        await updateDoc(doc(db, "gallery", id), {
          title: data.title.trim(),
          description: data.description?.trim() ?? "",
          imageUrl: data.imageUrl.trim(),
        });
      }
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const remove = async (item: GalleryItem) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    setDeletingId(item.id);
    await deleteDoc(doc(db, "gallery", item.id));
    setDeletingId(null);
  };

  // ── Reorder ──────────────────────────────────────────────────
  const reorder = async (item: GalleryItem, direction: "up" | "down") => {
    const idx = gallery.findIndex((g) => g.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= gallery.length) return;
    const swap = gallery[swapIdx];
    await updateDoc(doc(db, "gallery", item.id), { order: swap.order });
    await updateDoc(doc(db, "gallery", swap.id), { order: item.order });
  };

  const setField = (k: keyof GalleryItem, v: string) =>
    setModal((m) => (m ? { ...m, data: { ...m.data, [k]: v } } : null));

  const inp = "w-full px-3 py-2.5 text-sm rounded-xl border outline-none";
  const inpStyle = { borderColor: "#e5e7eb" };

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-2xl font-black"
            style={{ color: "var(--color-primary)" }}
          >
            Manage Gallery
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {gallery.length} image{gallery.length !== 1 ? "s" : ""} · drag order
            with the arrows
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "add", data: emptyForm() })}
          className="text-sm font-bold px-5 py-2.5 rounded-xl text-white border-none cursor-pointer"
          style={{ background: "var(--color-primary)" }}
        >
          + Add Image
        </button>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div
            className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
            style={{
              borderColor: "var(--color-primary)",
              borderTopColor: "transparent",
            }}
          />
        </div>
      ) : gallery.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl border-2 border-dashed"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div className="mb-3 inline-flex text-gray-400">
            <AppIcon name="gallery" size={44} />
          </div>
          <p className="text-gray-500 font-semibold">No images yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Click "+ Add Image" to get started.
          </p>
        </div>
      ) : (
        /* ── Image list ── */
        <div className="flex flex-col gap-3">
          {gallery.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border flex items-center gap-4 overflow-hidden"
              style={{
                borderColor: "#e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0" style={{ width: 100, height: 72 }}>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/100x72?text=No+Image";
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-3">
                <p className="font-bold text-gray-900 text-sm truncate">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {item.description}
                  </p>
                )}
                <p className="text-xs text-gray-300 mt-1">
                  Order: {item.order}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pr-4 flex-shrink-0">
                {/* Reorder */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => reorder(item, "up")}
                    disabled={idx === 0}
                    className="text-xs px-2 py-1 rounded border cursor-pointer disabled:opacity-30"
                    style={{
                      borderColor: "#e5e7eb",
                      background: "white",
                      color: "#374151",
                    }}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => reorder(item, "down")}
                    disabled={idx === gallery.length - 1}
                    className="text-xs px-2 py-1 rounded border cursor-pointer disabled:opacity-30"
                    style={{
                      borderColor: "#e5e7eb",
                      background: "white",
                      color: "#374151",
                    }}
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>

                <button
                  onClick={() => setModal({ mode: "edit", data: { ...item } })}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white border-none cursor-pointer"
                  style={{ background: "var(--color-primary)" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(item)}
                  disabled={deletingId === item.id}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white border-none cursor-pointer disabled:opacity-60"
                  style={{ background: "#ef4444" }}
                >
                  {deletingId === item.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ background: "var(--color-primary)" }}
            >
              <h3 className="text-white font-black text-lg">
                {modal.mode === "add" ? "Add Image" : "Edit Image"}
              </h3>
              <button
                onClick={() => setModal(null)}
                className="text-white text-2xl bg-transparent border-none cursor-pointer leading-none opacity-70"
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-screen">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Title *
                </label>
                <input
                  className={inp}
                  style={inpStyle}
                  value={modal.data.title ?? ""}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g. Lab Annual Meeting 2024"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Description{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  className={inp}
                  style={{ ...inpStyle, resize: "none" }}
                  value={modal.data.description ?? ""}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Short caption shown on hover..."
                />
              </div>

              {/* Image upload */}
              <CloudinaryUpload
                label="Image *"
                currentUrl={modal.data.imageUrl}
                aspectHint="Any aspect ratio works. Landscape images look best in the slideshow."
                onUpload={(r: CloudinaryUploadResult) =>
                  setField("imageUrl", r.secure_url)
                }
              />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setModal(null)}
                  className="text-sm font-semibold px-5 py-2 rounded-xl border cursor-pointer"
                  style={{
                    borderColor: "#d1d5db",
                    background: "white",
                    color: "#374151",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="text-sm font-bold px-6 py-2 rounded-xl text-white disabled:opacity-60 border-none cursor-pointer"
                  style={{ background: "var(--color-primary)" }}
                >
                  {saving
                    ? "Saving..."
                    : modal.mode === "add"
                      ? "Add Image"
                      : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageGallery;
