import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import AppIcon from "../components/AppIcon";
import CloudinaryUpload from "../components/CloudinaryUpload";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import type {
  CloudinaryUploadResult,
  CollaboratorProfile,
  CollaboratorPublication,
  ResearchIdea,
} from "../types";

type Tab = "profile" | "ideas" | "security";

const CollaboratorPortal: React.FC = () => {
  const { appUser, logout, firebaseUser } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<CollaboratorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.uid) return;
    const load = async () => {
      const snap = await getDocs(
        query(collection(db, "collaborators"), where("uid", "==", appUser.uid)),
      );
      if (!snap.empty) {
        setProfile({
          id: snap.docs[0].id,
          ...snap.docs[0].data(),
        } as CollaboratorProfile);
      }
      setLoading(false);
    };
    load();
  }, [appUser?.uid]);

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

  const tabStyle = (active: boolean) => ({
    padding: "10px 20px",
    border: "none",
    borderBottom: active
      ? "3px solid var(--color-primary)"
      : "3px solid transparent",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    color: active ? "var(--color-primary)" : "#6b7280",
    background: "transparent",
  });

  const displayName = profile?.name || appUser?.name || "";
  const displayPhoto = profile?.photo || "";

  return (
    <div>
      {/* Header */}
      <div
        className="py-10 px-4"
        style={{ background: "var(--color-primary)" }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {displayPhoto ? (
              <img
                src={displayPhoto}
                alt={displayName}
                className="rounded-full object-cover border-4 border-white"
                style={{ width: 64, height: 64 }}
              />
            ) : (
              <div
                className="rounded-full flex items-center justify-center text-white font-black text-2xl border-4 border-white"
                style={{
                  width: 64,
                  height: 64,
                  background: "var(--color-secondary)",
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-white font-black text-xl">{displayName}</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                {profile?.designation}
                {profile?.designation && profile?.affiliation ? " · " : ""}
                {profile?.affiliation}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold px-4 py-2 rounded-xl border cursor-pointer"
            style={{
              color: "white",
              borderColor: "rgba(255,255,255,0.4)",
              background: "transparent",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Tabs */}
        <div className="flex border-b mb-8" style={{ borderColor: "#e5e7eb" }}>
          <button
            style={tabStyle(tab === "profile")}
            onClick={() => setTab("profile")}
          >
            Edit My Profile
          </button>
          <button
            style={tabStyle(tab === "ideas")}
            onClick={() => setTab("ideas")}
          >
            My Research Ideas
          </button>
          <button
            style={tabStyle(tab === "security")}
            onClick={() => setTab("security")}
          >
            Security
          </button>
          <a
            href="/"
            className="ml-auto self-center text-xs font-semibold no-underline"
            style={{ color: "var(--color-secondary)" }}
          >
            ← View Website
          </a>
        </div>

        {tab === "profile" && profile && (
          <EditProfile profile={profile} onSaved={setProfile} />
        )}
        {tab === "ideas" && appUser && (
          <MyIdeas
            authorId={appUser.uid}
            authorName={displayName}
            authorPhoto={displayPhoto}
          />
        )}
        {tab === "security" && firebaseUser && (
          <ChangePassword
            firebaseUser={firebaseUser}
            userEmail={appUser?.email ?? ""}
          />
        )}
      </div>
    </div>
  );
};

// ── Change Password ────────────────────────────────────────────
import type { User as FirebaseUser } from "firebase/auth";

const ChangePassword: React.FC<{
  firebaseUser: FirebaseUser;
  userEmail: string;
}> = ({ firebaseUser, userEmail }) => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setSaving(true);
    try {
      // Re-authenticate first (Firebase requires this before password change)
      const credential = EmailAuthProvider.credential(
        userEmail,
        form.currentPassword,
      );
      await reauthenticateWithCredential(firebaseUser, credential);

      // Now update password
      await updatePassword(firebaseUser, form.newPassword);

      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Current password is incorrect.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 8 characters.");
      } else {
        setError("Failed to update password. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full px-3 py-2.5 text-sm rounded-xl border outline-none";
  const inpStyle = { borderColor: "#e5e7eb" };

  return (
    <div className="pb-16 max-w-md">
      <h2
        className="text-xl font-black mb-6"
        style={{ color: "var(--color-primary)" }}
      >
        Change Password
      </h2>

      <div
        className="bg-white rounded-2xl p-6 shadow-sm border"
        style={{ borderColor: "#e5e7eb" }}
      >
        {success && (
          <div
            className="rounded-xl p-3 mb-4 text-sm font-semibold text-green-700"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            Password updated successfully.
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Current Password *
            </label>
            <input
              required
              type="password"
              className={inp}
              style={inpStyle}
              value={form.currentPassword}
              onChange={(e) =>
                setForm((p) => ({ ...p, currentPassword: e.target.value }))
              }
              placeholder="Enter your current password"
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              New Password *{" "}
              <span className="text-gray-400 font-normal">
                (min. 8 characters)
              </span>
            </label>
            <input
              required
              type="password"
              className={inp}
              style={inpStyle}
              value={form.newPassword}
              onChange={(e) =>
                setForm((p) => ({ ...p, newPassword: e.target.value }))
              }
              placeholder="Enter new password"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Confirm New Password *
            </label>
            <input
              required
              type="password"
              className={inp}
              style={{
                ...inpStyle,
                borderColor:
                  form.confirmPassword &&
                  form.confirmPassword !== form.newPassword
                    ? "#ef4444"
                    : form.confirmPassword &&
                        form.confirmPassword === form.newPassword
                      ? "#22c55e"
                      : "#e5e7eb",
              }}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((p) => ({ ...p, confirmPassword: e.target.value }))
              }
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
            {form.confirmPassword &&
              form.confirmPassword !== form.newPassword && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
            {form.confirmPassword &&
              form.confirmPassword === form.newPassword && (
                <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
              )}
          </div>

          {error && (
            <div
              className="rounded-xl p-3 text-sm text-red-700"
              style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="font-bold px-6 py-2.5 rounded-xl text-white text-sm disabled:opacity-60 border-none cursor-pointer"
            style={{ background: "var(--color-primary)" }}
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div
          className="mt-5 pt-4 border-t text-xs text-gray-400"
          style={{ borderColor: "#f0f0f0" }}
        >
          <p>Tips for a strong password:</p>
          <ul className="mt-1 list-disc list-inside space-y-0.5">
            <li>At least 8 characters long</li>
            <li>Mix of uppercase and lowercase letters</li>
            <li>Include numbers and symbols (@, #, $, !)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ── Edit Profile ──────────────────────────────────────────────
const EditProfile: React.FC<{
  profile: CollaboratorProfile;
  onSaved: (p: CollaboratorProfile) => void;
}> = ({ profile, onSaved }) => {
  const [form, setForm] = useState<CollaboratorProfile>({ ...profile });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof CollaboratorProfile, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  const updatePub = (
    i: number,
    k: keyof CollaboratorPublication,
    v: string | number,
  ) => {
    const pubs = [...(form.publications ?? [])];
    pubs[i] = { ...pubs[i], [k]: v };
    set("publications", pubs);
  };

  const addPub = () =>
    set("publications", [
      ...(form.publications ?? []),
      {
        id: Date.now().toString(),
        title: "",
        journal: "",
        year: new Date().getFullYear(),
        url: "",
      },
    ]);

  const removePub = (i: number) =>
    set(
      "publications",
      (form.publications ?? []).filter((_, idx) => idx !== i),
    );

  const save = async () => {
    setSaving(true);
    try {
      const { id, ...data } = form;
      await updateDoc(doc(db, "collaborators", id), data as any);
      onSaved(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full px-3 py-2.5 text-sm rounded-xl border outline-none";
  const inpStyle = { borderColor: "#e5e7eb" };

  return (
    <div className="pb-16">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-xl font-black"
          style={{ color: "var(--color-primary)" }}
        >
          My Profile
        </h2>
        <button
          onClick={save}
          disabled={saving}
          className="text-sm font-bold px-5 py-2.5 rounded-xl text-white disabled:opacity-60 border-none cursor-pointer"
          style={{ background: saved ? "#22c55e" : "var(--color-primary)" }}
        >
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div
        className="bg-white rounded-2xl p-6 shadow-sm border mb-6"
        style={{ borderColor: "#e5e7eb" }}
      >
        <CloudinaryUpload
          label="Profile Photo"
          currentUrl={form.photo}
          onUpload={(r: CloudinaryUploadResult) => set("photo", r.secure_url)}
        />
      </div>

      <div
        className="bg-white rounded-2xl p-6 shadow-sm border mb-6"
        style={{ borderColor: "#e5e7eb" }}
      >
        <h3 className="font-bold text-sm text-gray-700 mb-4">Basic Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Full Name
            </label>
            <input
              className={inp}
              style={inpStyle}
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Dr. Jane Smith"
            />
          </div>
          {(
            [
              ["designation", "Designation"],
              ["affiliation", "Affiliation"],
            ] as const
          ).map(([k, label]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {label}
              </label>
              <input
                className={inp}
                style={inpStyle}
                value={(form as any)[k] ?? ""}
                onChange={(e) => set(k, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Bio
          </label>
          <textarea
            rows={5}
            className={inp}
            style={{ ...inpStyle, resize: "vertical" }}
            value={form.bio ?? ""}
            onChange={(e) => set("bio", e.target.value)}
          />
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Research Interests (comma separated)
          </label>
          <input
            className={inp}
            style={inpStyle}
            value={(form.researchInterests ?? []).join(", ")}
            onChange={(e) =>
              set(
                "researchInterests",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
      </div>

      <div
        className="bg-white rounded-2xl p-6 shadow-sm border mb-6"
        style={{ borderColor: "#e5e7eb" }}
      >
        <h3 className="font-bold text-sm text-gray-700 mb-4">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              ["linkedin", "LinkedIn"],
              ["orcid", "ORCID"],
              ["scholar", "Google Scholar"],
              ["researchgate", "ResearchGate"],
              ["facebook", "Facebook"],
            ] as const
          ).map(([k, label]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {label}
              </label>
              <input
                className={inp}
                style={inpStyle}
                value={(form as any)[k] ?? ""}
                onChange={(e) => set(k, e.target.value)}
                placeholder="https://..."
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="bg-white rounded-2xl p-6 shadow-sm border"
        style={{ borderColor: "#e5e7eb" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-gray-700">Publications</h3>
          <button
            onClick={addPub}
            className="text-xs font-bold bg-transparent border-none cursor-pointer"
            style={{ color: "var(--color-secondary)" }}
          >
            + Add
          </button>
        </div>
        {(form.publications ?? []).map((p, i) => (
          <div key={p.id} className="grid grid-cols-4 gap-2 mb-2 items-center">
            <input
              className={`${inp} col-span-2`}
              style={inpStyle}
              placeholder="Title"
              value={p.title}
              onChange={(e) => updatePub(i, "title", e.target.value)}
            />
            <input
              className={inp}
              style={inpStyle}
              placeholder="Journal"
              value={p.journal}
              onChange={(e) => updatePub(i, "journal", e.target.value)}
            />
            <div className="flex gap-1 items-center">
              <input
                className={inp}
                style={inpStyle}
                placeholder="Year"
                type="number"
                value={p.year}
                onChange={(e) => updatePub(i, "year", +e.target.value)}
              />
              <button
                onClick={() => removePub(i)}
                className="text-red-400 bg-transparent border-none cursor-pointer text-xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {(form.publications ?? []).length === 0 && (
          <p className="text-sm text-gray-400">No publications added yet.</p>
        )}
      </div>
    </div>
  );
};

// ── My Ideas ──────────────────────────────────────────────────
const MyIdeas: React.FC<{
  authorId: string;
  authorName: string;
  authorPhoto: string;
}> = ({ authorId, authorName, authorPhoto }) => {
  const [ideas, setIdeas] = useState<ResearchIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    fullDescription: "",
    tags: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const snap = await getDocs(
      query(collection(db, "researchIdeas"), where("authorId", "==", authorId)),
    );
    setIdeas(
      snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as ResearchIdea)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [authorId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.shortDescription || !form.fullDescription) return;
    setSubmitting(true);
    await addDoc(collection(db, "researchIdeas"), {
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      fullDescription: form.fullDescription.trim(),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      authorId,
      authorName,
      authorPhoto,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setShowForm(false);
    setForm({ title: "", shortDescription: "", fullDescription: "", tags: "" });
    setSubmitting(false);
    load();
  };

  const deleteIdea = async (idea: ResearchIdea) => {
    if (!window.confirm(`Delete "${idea.title}"?`)) return;
    await deleteDoc(doc(db, "researchIdeas", idea.id));
    load();
  };

  const inp = "w-full px-3 py-2.5 text-sm rounded-xl border outline-none";
  const inpStyle = { borderColor: "#e5e7eb" };

  return (
    <div className="pb-16">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-xl font-black"
          style={{ color: "var(--color-primary)" }}
        >
          My Research Ideas
        </h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-sm font-bold px-5 py-2.5 rounded-xl text-white border-none cursor-pointer"
          style={{ background: "var(--color-primary)" }}
        >
          {showForm ? "Cancel" : "+ Post New Idea"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white rounded-2xl p-6 shadow-sm border mb-6"
          style={{ borderColor: "#e5e7eb" }}
        >
          <h3
            className="font-bold text-base mb-4"
            style={{ color: "var(--color-primary)" }}
          >
            New Research Idea
          </h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Title *
              </label>
              <input
                required
                className={inp}
                style={inpStyle}
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Short Description *{" "}
                <span className="text-gray-400 font-normal">
                  (shown on card)
                </span>
              </label>
              <textarea
                required
                rows={2}
                className={inp}
                style={{ ...inpStyle, resize: "none" }}
                value={form.shortDescription}
                onChange={(e) =>
                  setForm((p) => ({ ...p, shortDescription: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Full Description *{" "}
                <span className="text-gray-400 font-normal">
                  (shown on detail page)
                </span>
              </label>
              <textarea
                required
                rows={6}
                className={inp}
                style={{ ...inpStyle, resize: "vertical" }}
                value={form.fullDescription}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fullDescription: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Tags{" "}
                <span className="text-gray-400 font-normal">
                  (comma separated)
                </span>
              </label>
              <input
                className={inp}
                style={inpStyle}
                value={form.tags}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tags: e.target.value }))
                }
                placeholder="AI, NLP, healthcare"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="self-end text-sm font-bold px-6 py-2.5 rounded-xl text-white disabled:opacity-60 border-none cursor-pointer"
              style={{ background: "var(--color-primary)" }}
            >
              {submitting ? "Posting..." : "Post Idea"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div
            className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
            style={{
              borderColor: "var(--color-primary)",
              borderTopColor: "transparent",
            }}
          />
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-3 inline-flex text-gray-400">
            <AppIcon name="ideas" size={36} />
          </div>
          <p className="text-gray-400">You haven't posted any ideas yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white rounded-2xl p-4 shadow-sm border flex items-start gap-4"
              style={{ borderColor: "#e5e7eb" }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{idea.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                  {idea.shortDescription}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(idea.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {idea.commentCount ?? 0} comments
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a
                  href={`/research-ideas/${idea.id}`}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg no-underline"
                  style={{ background: "#eff6ff", color: "#1d4ed8" }}
                >
                  View
                </a>
                <button
                  onClick={() => deleteIdea(idea)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white cursor-pointer border-none"
                  style={{ background: "#ef4444" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollaboratorPortal;
