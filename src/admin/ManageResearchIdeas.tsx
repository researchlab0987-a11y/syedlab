import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import {
  AlertTriangle,
  Edit2,
  Eye,
  EyeOff,
  LockOpen,
  MapPin,
  Trash2,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import AppIcon from "../components/AppIcon";
import { db } from "../firebase/config";
import type { Comment, ResearchIdea } from "../types";

type FilterTab = "all" | "published" | "hidden" | "flagged";
type SortBy = "newest" | "oldest" | "most-comments" | "recent-activity";

interface DetailsPanelState {
  ideaId: string;
  idea: ResearchIdea;
}

export const ManageResearchIdeas: React.FC = () => {
  const [ideas, setIdeas] = useState<ResearchIdea[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [search, setSearch] = useState("");
  const [detailsPanel, setDetailsPanel] = useState<DetailsPanelState | null>(
    null,
  );

  // Load research ideas
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

  // Load comments for a specific idea
  const loadComments = async (ideaId: string) => {
    const snap = await getDocs(
      query(collection(db, "comments"), orderBy("createdAt", "asc")),
    );
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment);
    const filtered = all.filter((c) => c.ideaId === ideaId);
    setComments((p) => ({
      ...p,
      [ideaId]: filtered,
    }));
    return filtered;
  };

  useEffect(() => {
    load();
  }, []);

  // Delete idea with confirmation
  const deleteIdea = async (idea: ResearchIdea) => {
    if (!window.confirm(`Delete idea "${idea.title}"?`)) return;
    await deleteDoc(doc(db, "researchIdeas", idea.id));
    setDetailsPanel(null);
    load();
  };

  // Delete comment
  const deleteComment = async (comment: Comment) => {
    if (!window.confirm("Delete this comment?")) return;
    await deleteDoc(doc(db, "comments", comment.id));
    await updateDoc(doc(db, "researchIdeas", comment.ideaId), {
      commentCount: Math.max(
        0,
        (ideas.find((i) => i.id === comment.ideaId)?.commentCount ?? 1) - 1,
      ),
    });
    loadComments(comment.ideaId);
    load();
  };

  // Toggle publish status
  const togglePublished = async (idea: ResearchIdea) => {
    await updateDoc(doc(db, "researchIdeas", idea.id), {
      isPublished: !idea.isPublished,
    });
    load();
  };

  // Toggle hidden status
  const toggleHidden = async (idea: ResearchIdea) => {
    await updateDoc(doc(db, "researchIdeas", idea.id), {
      isHidden: !idea.isHidden,
    });
    load();
  };

  // Toggle flagged status (for moderation)
  const toggleFlagged = async (idea: ResearchIdea) => {
    await updateDoc(doc(db, "researchIdeas", idea.id), {
      isFlagged: !idea.isFlagged,
    });
    load();
  };

  // Pin/unpin idea
  const togglePinned = async (idea: ResearchIdea) => {
    await updateDoc(doc(db, "researchIdeas", idea.id), {
      isPinned: !idea.isPinned,
    });
    load();
  };

  // Filter ideas based on active tab
  const filtered = useMemo(() => {
    let result = ideas;

    // Apply tab filter
    switch (filterTab) {
      case "published":
        result = result.filter((i) => i.isPublished);
        break;
      case "hidden":
        result = result.filter((i) => i.isHidden);
        break;
      case "flagged":
        result = result.filter((i) => i.isFlagged);
        break;
      default:
        break;
    }

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.authorName.toLowerCase().includes(q) ||
          i.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Apply sort
    switch (sortBy) {
      case "oldest":
        result = [...result].reverse();
        break;
      case "most-comments":
        result = [...result].sort(
          (a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0),
        );
        break;
      case "recent-activity":
        // Sort by most recent update/comment
        break;
      default:
        // newest is already default from load()
        break;
    }

    return result;
  }, [ideas, filterTab, search, sortBy]);

  // Calculate stats
  const stats = useMemo(
    () => ({
      total: ideas.length,
      published: ideas.filter((i) => i.isPublished).length,
      hidden: ideas.filter((i) => i.isHidden).length,
      flagged: ideas.filter((i) => i.isFlagged).length,
    }),
    [ideas],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{
            borderColor: "var(--color-primary)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <h2
          className="text-2xl font-black"
          style={{ color: "var(--color-primary)" }}
        >
          Manage Research Ideas
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {filtered.length} of {ideas.length} ideas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div
          className="bg-white rounded-xl p-3 border"
          style={{ borderColor: "#e5e7eb" }}
        >
          <p className="text-xs text-gray-500 font-semibold uppercase">Total</p>
          <p className="text-2xl font-black mt-1">{stats.total}</p>
        </div>
        <div
          className="bg-white rounded-xl p-3 border"
          style={{ borderColor: "#e5e7eb" }}
        >
          <p className="text-xs text-gray-500 font-semibold uppercase">
            Published
          </p>
          <p className="text-2xl font-black mt-1" style={{ color: "#10b981" }}>
            {stats.published}
          </p>
        </div>
        <div
          className="bg-white rounded-xl p-3 border"
          style={{ borderColor: "#e5e7eb" }}
        >
          <p className="text-xs text-gray-500 font-semibold uppercase">
            Hidden
          </p>
          <p className="text-2xl font-black mt-1" style={{ color: "#6b7280" }}>
            {stats.hidden}
          </p>
        </div>
        <div
          className="bg-white rounded-xl p-3 border"
          style={{ borderColor: "#e5e7eb" }}
        >
          <p className="text-xs text-gray-500 font-semibold uppercase">
            Flagged
          </p>
          <p className="text-2xl font-black mt-1" style={{ color: "#ef4444" }}>
            {stats.flagged}
          </p>
        </div>
      </div>

      {/* Toolbar: Search + Sort */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, author, tags..."
          className="flex-1 text-sm px-4 py-2.5 rounded-xl border outline-none"
          style={{ borderColor: "#d1d5db" }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="text-sm px-4 py-2.5 rounded-xl border outline-none"
          style={{ borderColor: "#d1d5db" }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="most-comments">Most Comments</option>
        </select>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", "published", "hidden", "flagged"] as FilterTab[]).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                filterTab === tab
                  ? "text-white border-transparent"
                  : "text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              style={{
                background:
                  filterTab === tab ? "var(--color-primary)" : "white",
                borderColor: filterTab === tab ? "transparent" : "#d1d5db",
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "all" && ` (${stats.total})`}
              {tab === "published" && ` (${stats.published})`}
              {tab === "hidden" && ` (${stats.hidden})`}
              {tab === "flagged" && ` (${stats.flagged})`}
            </button>
          ),
        )}
      </div>

      {/* Ideas List */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="text-center">
              <AppIcon name="ideas" size={40} />
              <p className="mt-2">No ideas match your filters.</p>
            </div>
          </div>
        ) : (
          filtered.map((idea) => (
            <IdeaRow
              key={idea.id}
              idea={idea}
              commentCount={comments[idea.id]?.length ?? 0}
              onViewDetails={() => {
                setDetailsPanel({ ideaId: idea.id, idea });
                loadComments(idea.id);
              }}
              onEdit={() => {
                // TODO: Implement edit modal
              }}
              onTogglePublished={() => {
                togglePublished(idea);
              }}
              onTogglePinned={() => {
                togglePinned(idea);
              }}
              onToggleHidden={() => {
                toggleHidden(idea);
              }}
              onToggleFlagged={() => {
                toggleFlagged(idea);
              }}
              onDelete={() => {
                deleteIdea(idea);
              }}
            />
          ))
        )}
      </div>

      {/* Details Side Panel */}
      {detailsPanel && (
        <DetailPanel
          idea={detailsPanel.idea}
          comments={comments[detailsPanel.ideaId] ?? []}
          onDeleteComment={deleteComment}
          onDelete={() => {
            deleteIdea(detailsPanel.idea);
          }}
          onClose={() => setDetailsPanel(null)}
        />
      )}
    </div>
  );
};

// ── Idea Row Component ──────────────────────────────────────────
interface IdeaRowProps {
  idea: ResearchIdea;
  commentCount: number;
  onViewDetails: () => void;
  onEdit: () => void;
  onTogglePublished: () => void;
  onTogglePinned: () => void;
  onToggleHidden: () => void;
  onToggleFlagged: () => void;
  onDelete: () => void;
}

const IdeaRow: React.FC<IdeaRowProps> = ({
  idea,
  commentCount,
  onViewDetails,
  onEdit,
  onTogglePublished,
  onTogglePinned,
  onToggleHidden,
  onToggleFlagged,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border overflow-visible hover:shadow-md transition-shadow"
      style={{ borderColor: "#e5e7eb" }}
    >
      <div className="p-4 flex items-start gap-4">
        {/* Left: Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <p className="font-bold text-gray-900 leading-snug flex-1">
              {idea.title}
            </p>
            {idea.isPinned && (
              <div
                className="text-xs font-bold px-2 py-1 rounded-md flex-shrink-0"
                style={{ background: "#fef3c7", color: "#92400e" }}
              >
                📌 Pinned
              </div>
            )}
            {idea.isFlagged && (
              <div
                className="text-xs font-bold px-2 py-1 rounded-md flex-shrink-0"
                style={{ background: "#fee2e2", color: "#991b1b" }}
              >
                ⚠️ Flagged
              </div>
            )}
            {idea.isHidden && (
              <div
                className="text-xs font-bold px-2 py-1 rounded-md flex-shrink-0"
                style={{ background: "#f3f4f6", color: "#6b7280" }}
              >
                👁️ Hidden
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-2">
            By {idea.authorName} ·{" "}
            {new Date(idea.createdAt).toLocaleDateString()} ·{" "}
            <span className="font-semibold">{commentCount}</span> comments
          </p>

          {idea.tags && idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {idea.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#eff6ff", color: "#1d4ed8" }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: Menu Button + Popover */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <AppIcon name="more" size={20} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border shadow-xl z-[70] overflow-hidden"
              style={{ borderColor: "#e5e7eb" }}
            >
              <button
                onClick={() => {
                  onViewDetails();
                  setMenuOpen(false);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <Eye size={18} style={{ color: "var(--color-primary)" }} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    View Details
                  </p>
                  <p className="text-xs text-gray-500">
                    Full description and comments
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  onEdit();
                  setMenuOpen(false);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <Edit2 size={18} style={{ color: "#f59e0b" }} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Edit</p>
                  <p className="text-xs text-gray-500">Modify idea details</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onTogglePublished();
                  setMenuOpen(false);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <LockOpen size={18} style={{ color: "#3b82f6" }} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {idea.isPublished ? "Unpublish" : "Publish"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {idea.isPublished ? "Hide from public" : "Show to public"}
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  onTogglePinned();
                  setMenuOpen(false);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <MapPin size={18} style={{ color: "#ec4899" }} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {idea.isPinned ? "Unpin" : "Pin"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {idea.isPinned
                      ? "Remove from featured"
                      : "Feature this idea"}
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  onToggleFlagged();
                  setMenuOpen(false);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <AlertTriangle size={18} style={{ color: "#ef4444" }} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {idea.isFlagged ? "Unflag" : "Flag for Review"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {idea.isFlagged
                      ? "Mark as safe"
                      : "Mark as needs moderation"}
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  onToggleHidden();
                  setMenuOpen(false);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <EyeOff size={18} style={{ color: "#6b7280" }} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {idea.isHidden ? "Show" : "Hide"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {idea.isHidden ? "Make visible" : "Make hidden"}
                  </p>
                </div>
              </button>

              <div
                className="mx-4 border-t"
                style={{ borderColor: "#f0f0f0" }}
              />

              <button
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors"
              >
                <Trash2 size={18} style={{ color: "#dc2626" }} />
                <div>
                  <p className="text-sm font-semibold text-red-600">Delete</p>
                  <p className="text-xs text-red-500">Permanently remove</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Details Panel Component ──────────────────────────────────────────
interface DetailPanelProps {
  idea: ResearchIdea;
  comments: Comment[];
  onDeleteComment: (comment: Comment) => void;
  onDelete: () => void;
  onClose: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  idea,
  comments,
  onDeleteComment,
  onDelete,
  onClose,
}) => {
  const [topOffset, setTopOffset] = useState(0);

  React.useEffect(() => {
    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    const getTopNavOffset = () => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>(
          "header, nav, [role='navigation']",
        ),
      );

      let maxBottom = 0;
      for (const node of nodes) {
        const style = window.getComputedStyle(node);
        if (style.position !== "fixed" && style.position !== "sticky") continue;

        const rect = node.getBoundingClientRect();
        // Ignore sidebars and off-screen elements; keep only top horizontal bars.
        if (rect.width < window.innerWidth * 0.5) continue;
        if (rect.bottom <= 0) continue;
        if (rect.top > 0 && style.position === "fixed") continue;

        maxBottom = Math.max(maxBottom, rect.bottom);
      }

      setTopOffset(Math.max(0, Math.round(maxBottom)));
    };

    getTopNavOffset();
    window.addEventListener("resize", getTopNavOffset);

    const observer = new ResizeObserver(getTopNavOffset);
    const observed = Array.from(
      document.querySelectorAll<HTMLElement>(
        "header, nav, [role='navigation']",
      ),
    );
    observed.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("resize", getTopNavOffset);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Overlay - clickable everywhere to close */}
      <div
        className="fixed left-0 right-0 bottom-0 bg-black/50 z-40 cursor-pointer"
        style={{ top: topOffset }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Panel */}
      <div
        className="fixed right-0 bottom-0 w-full sm:max-w-md bg-white shadow-lg z-50 flex flex-col overflow-hidden"
        style={{
          top: topOffset,
          background: "white",
          boxShadow: "0 20px 25px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "#e5e7eb" }}
        >
          <h3 className="font-bold text-lg text-gray-900">Idea Details</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete this idea"
            >
              <AppIcon name="message" size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="Close details"
            >
              <AppIcon name="back" size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Title */}
          <h4 className="font-bold text-lg text-gray-900 mb-1">{idea.title}</h4>
          <p className="text-xs text-gray-500 mb-4">
            By {idea.authorName} ·{" "}
            {new Date(idea.createdAt).toLocaleDateString()}
          </p>

          {/* Tags */}
          {idea.tags && idea.tags.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Tags
              </p>
              <div className="flex flex-wrap gap-1">
                {idea.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: "#eff6ff", color: "#1d4ed8" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Short Description */}
          {idea.shortDescription && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Summary
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {idea.shortDescription}
              </p>
            </div>
          )}

          {/* Full Description */}
          {idea.fullDescription && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Full Description
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {idea.fullDescription}
              </p>
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Comments ({comments.length})
            </p>
            {comments.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No comments yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-gray-50 rounded-lg p-3 border"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-xs font-bold text-gray-700">
                          {c.authorName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(c.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteComment(c)}
                        className="text-xs text-red-500 hover:text-red-700 font-bold bg-transparent border-none cursor-pointer flex-shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageResearchIdeas;
