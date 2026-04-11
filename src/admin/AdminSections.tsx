import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import AppIcon from "../components/AppIcon";
import { db } from "../firebase/config";
import type {
  Announcement,
  Comment,
  ContactMessage,
  ResearchIdea,
} from "../types";

// ── Manage Ideas ──────────────────────────────────────────────
export const ManageIdeas: React.FC = () => {
  const [ideas, setIdeas] = useState<ResearchIdea[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    const snap = await getDocs(
      query(collection(db, "researchIdeas"), orderBy("createdAt", "desc")),
    );
    const loaded = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as ResearchIdea,
    );
    setIdeas(loaded);
    setLoading(false);
  };

  const loadComments = async (ideaId: string) => {
    const snap = await getDocs(
      query(collection(db, "comments"), orderBy("createdAt", "asc")),
    );
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment);
    setComments((p) => ({
      ...p,
      [ideaId]: all.filter((c) => c.ideaId === ideaId),
    }));
  };

  useEffect(() => {
    load();
  }, []);

  const deleteIdea = async (idea: ResearchIdea) => {
    if (!window.confirm(`Delete idea "${idea.title}"?`)) return;
    await deleteDoc(doc(db, "researchIdeas", idea.id));
    load();
  };

  const deleteComment = async (comment: Comment) => {
    await deleteDoc(doc(db, "comments", comment.id));
    await updateDoc(doc(db, "researchIdeas", comment.ideaId), {
      commentCount: Math.max(
        0,
        (ideas.find((i) => i.id === comment.ideaId)?.commentCount ?? 1) - 1,
      ),
    });
    loadComments(comment.ideaId);
  };

  const toggle = (id: string) => {
    const next = expanded === id ? null : id;
    setExpanded(next);
    if (next && !comments[next]) loadComments(next);
  };

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-2xl font-black"
          style={{ color: "var(--color-primary)" }}
        >
          Manage Research Ideas
        </h2>
        <p className="text-sm text-gray-500 mt-1">{ideas.length} ideas total</p>
      </div>

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
      ) : (
        <div className="flex flex-col gap-3">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white rounded-2xl shadow-sm border overflow-hidden"
              style={{ borderColor: "#e5e7eb" }}
            >
              <div className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 leading-snug">
                    {idea.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    By {idea.authorName} ·{" "}
                    {new Date(idea.createdAt).toLocaleDateString()} ·{" "}
                    {idea.commentCount ?? 0} comments
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {idea.tags?.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "#eff6ff", color: "#1d4ed8" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggle(idea.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer"
                    style={{
                      borderColor: "#d1d5db",
                      background: "white",
                      color: "#374151",
                    }}
                  >
                    {expanded === idea.id ? "Hide" : "Comments"}
                  </button>
                  <button
                    onClick={() => deleteIdea(idea)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg text-white cursor-pointer border-none"
                    style={{ background: "#ef4444" }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expanded === idea.id && (
                <div
                  className="border-t px-4 py-3"
                  style={{ borderColor: "#f0f0f0", background: "#f9fafb" }}
                >
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Comments ({(comments[idea.id] ?? []).length})
                  </p>
                  {(comments[idea.id] ?? []).length === 0 ? (
                    <p className="text-xs text-gray-400">No comments yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {(comments[idea.id] ?? []).map((c) => (
                        <div
                          key={c.id}
                          className="bg-white rounded-xl p-3 flex items-start justify-between gap-3 border"
                          style={{ borderColor: "#e5e7eb" }}
                        >
                          <div>
                            <p className="text-xs font-bold text-gray-700">
                              {c.authorName}{" "}
                              <span className="text-gray-400 font-normal">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {c.content}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteComment(c)}
                            className="text-xs font-bold text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer flex-shrink-0"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {ideas.length === 0 && (
            <p className="text-center text-gray-400 py-10">
              No research ideas posted yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Contact Messages ──────────────────────────────────────────
export const ContactMessages: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    const snap = await getDocs(
      query(collection(db, "contactMessages"), orderBy("submittedAt", "desc")),
    );
    setMessages(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ContactMessage),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (msg: ContactMessage) => {
    await updateDoc(doc(db, "contactMessages", msg.id), { isRead: true });
    load();
  };

  const remove = async (msg: ContactMessage) => {
    if (!window.confirm("Delete this message?")) return;
    await deleteDoc(doc(db, "contactMessages", msg.id));
    load();
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-2xl font-black"
          style={{ color: "var(--color-primary)" }}
        >
          Contact Messages
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {messages.length} total ·{" "}
          <span
            className="font-bold"
            style={{ color: unreadCount > 0 ? "#ef4444" : "#6b7280" }}
          >
            {unreadCount} unread
          </span>
        </p>
      </div>

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
      ) : messages.length === 0 ? (
        <div
          className="text-center py-20 bg-white rounded-2xl border"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div className="mb-3 inline-flex text-gray-400">
            <AppIcon name="contact" size={34} />
          </div>
          <p className="text-gray-500">No messages yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-2xl shadow-sm border overflow-hidden"
              style={{
                borderColor: "#e5e7eb",
                borderLeft: `4px solid ${msg.isRead ? "#e5e7eb" : "var(--color-accent)"}`,
              }}
            >
              <div
                className="p-4 flex items-start gap-4 cursor-pointer"
                onClick={() => {
                  setExpanded((p) => (p === msg.id ? null : msg.id));
                  if (!msg.isRead) markRead(msg);
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-gray-900 text-sm">
                      {msg.name}
                    </p>
                    {!msg.isRead && (
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "#fee2e2", color: "#991b1b" }}
                      >
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {msg.email} · {new Date(msg.submittedAt).toLocaleString()}
                  </p>
                  {msg.subject && (
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      Re: {msg.subject}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(msg);
                  }}
                  className="text-xs font-bold text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer flex-shrink-0"
                >
                  Delete
                </button>
              </div>
              {expanded === msg.id && (
                <div
                  className="border-t px-4 py-4"
                  style={{ borderColor: "#f0f0f0", background: "#f9fafb" }}
                >
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {msg.message}
                  </p>
                  <a
                    href={`mailto:${msg.email}?subject=Re: ${msg.subject ?? "Your message to Rahman Research Lab"}`}
                    className="inline-block mt-3 text-xs font-bold no-underline px-4 py-1.5 rounded-lg text-white"
                    style={{ background: "var(--color-primary)" }}
                  >
                    Reply via Email
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Announcements ─────────────────────────────────────────────
export const ManageAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const snap = await getDocs(
      query(collection(db, "announcements"), orderBy("order", "asc")),
    );
    setAnnouncements(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement),
    );
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    const maxOrder = announcements.reduce(
      (m, a) => Math.max(m, a.order ?? 0),
      0,
    );
    await addDoc(collection(db, "announcements"), {
      content: newText.trim(),
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    });
    setNewText("");
    load();
    setAdding(false);
  };

  const remove = async (a: Announcement) => {
    await deleteDoc(doc(db, "announcements", a.id));
    load();
  };

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-2xl font-black"
          style={{ color: "var(--color-primary)" }}
        >
          Announcements
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Shown in the Latest Updates section on the Home page.
        </p>
      </div>

      <div
        className="bg-white rounded-2xl p-5 shadow-sm border mb-6"
        style={{ borderColor: "#e5e7eb" }}
      >
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          New Announcement
        </label>
        <textarea
          rows={3}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="w-full px-4 py-2.5 text-sm rounded-xl border outline-none mb-3"
          style={{
            borderColor: "#e5e7eb",
            resize: "none",
            fontFamily: "var(--font-body)",
          }}
          placeholder="e.g. Our paper has been accepted at NeurIPS 2024."
        />
        <button
          onClick={add}
          disabled={adding || !newText.trim()}
          className="text-sm font-bold px-5 py-2 rounded-xl text-white disabled:opacity-60 border-none cursor-pointer"
          style={{ background: "var(--color-primary)" }}
        >
          {adding ? "Adding..." : "Add Announcement"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-xl p-4 shadow-sm border flex items-start gap-4"
            style={{
              borderColor: "#e5e7eb",
              borderLeft: "4px solid var(--color-accent)",
            }}
          >
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-relaxed">
                {a.content}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(a.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={() => remove(a)}
              className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer text-lg leading-none flex-shrink-0"
            >
              ×
            </button>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            No announcements yet.
          </p>
        )}
      </div>
    </div>
  );
};
