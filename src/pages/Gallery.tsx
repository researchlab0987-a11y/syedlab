import React, { useEffect, useMemo, useRef, useState } from "react";
import AppIcon from "../components/AppIcon";
import { useGallery, useSiteContent } from "../firebase/hooks";
import type { GalleryItem } from "../types";

type FlipDirection = "next" | "prev";

type FlipState = {
  direction: FlipDirection;
  progress: number;
  settling: boolean;
};

const getGalleryYear = (item: GalleryItem) => {
  const parsed = new Date(item.createdAt);
  return Number.isNaN(parsed.getTime())
    ? new Date().getFullYear()
    : parsed.getFullYear();
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getGalleryPageItems = (gallery: GalleryItem[], pageIndex: number) => {
  const leftIndex = pageIndex * 2;
  const rightIndex = leftIndex + 1;

  return {
    leftItem: gallery[leftIndex] || null,
    rightItem: rightIndex < gallery.length ? gallery[rightIndex] : null,
  };
};

const Gallery: React.FC = () => {
  const { gallery, loading } = useGallery();
  const { content } = useSiteContent();
  const [viewMode, setViewMode] = useState<"gallery" | "album">("gallery");
  const [albumPage, setAlbumPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(gallery.length / 2));
  const albumIndex = clamp(albumPage, 0, totalPages - 1);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (viewMode !== "album") return;
      if (e.key === "Escape") setViewMode("gallery");
      if (e.key === "ArrowRight")
        setAlbumPage((value) => Math.min(value + 1, totalPages - 1));
      if (e.key === "ArrowLeft")
        setAlbumPage((value) => Math.max(value - 1, 0));
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewMode, totalPages]);

  const galleryStats = useMemo(() => {
    const years = gallery.map((item) => getGalleryYear(item));
    const uniqueYears = new Set(years);

    return {
      total: gallery.length,
      years: uniqueYears.size,
      latestYear: years.length ? Math.max(...years) : new Date().getFullYear(),
    };
  }, [gallery]);

  return (
    <div>
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-20 text-center px-4"
        style={{ background: "var(--color-primary)" }}
      >
        {content["gallery.bannerUrl"] && (
          <img
            src={content["gallery.bannerUrl"]}
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
            {content["gallery.pageTitle"] ?? "Gallery"}
          </h1>
          <p
            className="text-base max-w-xl mx-auto"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            {content["gallery.pageSubtitle"] ??
              "Moments, milestones, and memories from the lab."}
          </p>
        </div>
      </section>

      {/* ── Gallery / Album Toggle ── */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        {gallery.length > 0 && (
          <>
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Moments",
                  value: String(galleryStats.total),
                  hint: "Published gallery items",
                  icon: "gallery" as const,
                },
                {
                  label: "Archive",
                  value: String(galleryStats.years),
                  hint: `Latest year ${galleryStats.latestYear}`,
                  icon: "publications" as const,
                },
                {
                  label: "View",
                  value: viewMode === "album" ? "Album Book" : "Gallery Grid",
                  hint:
                    viewMode === "album"
                      ? "Swipe pages like a book"
                      : "Scroll through cards",
                  icon: "message" as const,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border bg-white px-4 py-4 flex items-center gap-3"
                  style={{
                    borderColor: "#e5e7eb",
                    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: "#f8fafc",
                      color: "var(--color-primary)",
                    }}
                  >
                    <AppIcon name={stat.icon} size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-base font-black text-gray-900 truncate">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {stat.hint}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode("gallery")}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
                style={{
                  background:
                    viewMode === "gallery" ? "var(--color-primary)" : "white",
                  color: viewMode === "gallery" ? "white" : "#334155",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
                }}
              >
                Gallery Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("album")}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
                style={{
                  background:
                    viewMode === "album" ? "var(--color-primary)" : "white",
                  color: viewMode === "album" ? "white" : "#334155",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
                }}
              >
                Album Book
              </button>
              <p className="text-sm text-gray-500">
                {viewMode === "album"
                  ? "Drag the page or swipe to flip through the album."
                  : "Switch to album book to view equal-sized pages."}
              </p>
            </div>
          </>
        )}

        {loading ? (
          <div className="py-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl overflow-hidden border animate-pulse"
                  style={{ borderColor: "#e5e7eb", background: "#fafafa" }}
                >
                  <div className="h-56 bg-gradient-to-br from-gray-200 to-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                    <div className="h-3 w-full rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : gallery.length === 0 ? (
          <div
            className="text-center py-24 rounded-3xl border"
            style={{
              borderColor: "#e5e7eb",
              background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            }}
          >
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl text-gray-400 bg-white shadow-sm">
              <AppIcon name="gallery" size={30} />
            </div>
            <p className="text-gray-900 text-lg font-black">
              No gallery items yet.
            </p>
            <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
              This space will fill with lab milestones, events, and shared
              moments as soon as images are added.
            </p>
          </div>
        ) : viewMode === "gallery" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch transition-all duration-300 ease-out">
            {gallery.map((item, idx) => (
              <GalleryCard key={item.id} item={item} priority={idx < 2} />
            ))}
          </div>
        ) : (
          <AlbumBookView
            gallery={gallery}
            pageIndex={albumIndex}
            onPrev={() => setAlbumPage((value) => Math.max(value - 1, 0))}
            onNext={() =>
              setAlbumPage((value) => Math.min(value + 1, totalPages - 1))
            }
          />
        )}
      </div>
    </div>
  );
};

// ── Gallery Card ───────────────────────────────────────────────
const GalleryCard: React.FC<{
  item: GalleryItem;
  onClick?: () => void;
  priority?: boolean;
}> = ({ item, onClick, priority = false }) => {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const itemYear = getGalleryYear(item);
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative h-full overflow-hidden rounded-2xl border bg-white ${isClickable ? "cursor-pointer" : "cursor-default"}`}
      style={{
        borderColor: "#e5e7eb",
        boxShadow: "0 1px 8px rgba(15,23,42,0.05)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div className="relative overflow-hidden bg-white aspect-[4/3]">
        {imgErr ? (
          <div
            className="flex h-full flex-col items-center justify-center text-gray-400 text-sm font-medium"
            style={{
              background: "#fafafa",
            }}
          >
            <AppIcon name="gallery" size={22} />
            <span className="mt-2">Image unavailable</span>
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.title}
            onError={() => setImgErr(true)}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover bg-slate-100 transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        )}
      </div>

      <div
        className="absolute inset-x-3 bottom-3 rounded-xl border px-3 py-3 shadow-lg"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 0.22s ease, transform 0.22s ease",
          background: "rgba(255,255,255,0.74)",
          borderColor: "rgba(255,255,255,0.5)",
          backdropFilter: "blur(8px)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <div
          className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t"
          style={{
            background: "rgba(255,255,255,0.74)",
            borderColor: "rgba(255,255,255,0.5)",
          }}
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-1">
          {itemYear}
        </p>
        <p className="text-gray-900 font-black text-xs leading-snug line-clamp-1">
          {item.title}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-gray-600 line-clamp-2">
          {item.description || "No description provided."}
        </p>
        <p className="mt-1.5 text-[10px] text-gray-500">
          Uploaded by {item.uploaderName || "Lab team"}
        </p>
      </div>
    </div>
  );
};

// ── Album Book View (Corrected 3D Engine) ─────────────────────────────
const AlbumBookView: React.FC<{
  gallery: GalleryItem[];
  pageIndex: number;
  onPrev: () => void;
  onNext: () => void;
}> = ({ gallery, pageIndex, onPrev, onNext }) => {
  const totalPages = Math.ceil(gallery.length / 2);
  const currentSpread = getGalleryPageItems(gallery, pageIndex);
  const previousSpread = getGalleryPageItems(gallery, pageIndex - 1);
  const nextSpread = getGalleryPageItems(gallery, pageIndex + 1);

  const [flipState, setFlipState] = useState<FlipState | null>(null);
  const bookRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef<{
    pointerId: number;
    direction: FlipDirection;
    startX: number;
    width: number;
    progress: number;
  } | null>(null);
  const settleTimerRef = useRef<number | null>(null);

  // Clear any ongoing flips if the page navigates externally
  useEffect(() => {
    setFlipState(null);
    gestureRef.current = null;
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, [pageIndex]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current !== null)
        window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  const isFirst = pageIndex === 0;
  const isLast = pageIndex === totalPages - 1;

  const dragProgress = flipState?.progress ?? 0;
  const activeDirection = flipState?.direction ?? null;
  const isNext = activeDirection === "next";
  const isPrev = activeDirection === "prev";

  // Underlay Static Pages setup logic
  const staticLeftItem = isPrev
    ? previousSpread.leftItem
    : currentSpread.leftItem;
  const staticRightItem = isNext
    ? nextSpread.rightItem
    : currentSpread.rightItem;

  // Flip Container mapping (Front and Back side contents)
  const flipFrontItem = isNext
    ? currentSpread.rightItem
    : currentSpread.leftItem;
  const flipBackItem = isNext ? nextSpread.leftItem : previousSpread.rightItem;

  const getYear = (item: GalleryItem | null) => {
    if (!item) return "";
    const parsed = new Date(item.createdAt);
    return Number.isNaN(parsed.getTime())
      ? String(new Date().getFullYear())
      : String(parsed.getFullYear());
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-[#f8fafc] p-4 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] transition-all duration-300 ease-out">
      {/* View Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
            Album Book
          </p>
          <p className="text-sm text-gray-500">
            Drag on desktop or swipe on mobile to flip pages.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
          Page {pageIndex + 1} / {totalPages}
        </div>
      </div>

      {/* Book Container with proper Perspective */}
      <div
        ref={bookRef}
        className="relative flex items-center justify-center w-full max-w-5xl mx-auto rounded-3xl"
        style={{
          minHeight: "min(72vh, 680px)",
          perspective: "2500px",
          touchAction: "pan-y",
          userSelect: "none",
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          if ((e.target as HTMLElement | null)?.closest("button")) return;
          if (!bookRef.current) return;

          const rect = bookRef.current.getBoundingClientRect();
          const localX = e.clientX - rect.left;
          const canFlipNext = pageIndex < totalPages - 1;
          const canFlipPrev = pageIndex > 0;

          const direction: FlipDirection | null =
            localX >= rect.width / 2
              ? canFlipNext
                ? "next"
                : null
              : canFlipPrev
                ? "prev"
                : null;

          if (!direction) return;

          gestureRef.current = {
            pointerId: e.pointerId,
            direction,
            startX: e.clientX,
            width: rect.width,
            progress: 0,
          };
          setFlipState({ direction, progress: 0, settling: false });

          if (!bookRef.current.hasPointerCapture(e.pointerId)) {
            bookRef.current.setPointerCapture(e.pointerId);
          }
        }}
        onPointerMove={(e) => {
          const gesture = gestureRef.current;
          if (!gesture || gesture.pointerId !== e.pointerId) return;

          // Drag calculation mapped correctly relative to individual page width (half the whole book width)
          const rawProgress =
            gesture.direction === "next"
              ? (gesture.startX - e.clientX) / (gesture.width / 2)
              : (e.clientX - gesture.startX) / (gesture.width / 2);

          const progress = clamp(rawProgress, 0, 1);

          gesture.progress = progress;
          setFlipState({
            direction: gesture.direction,
            progress,
            settling: false,
          });
        }}
        onPointerUp={(e) => {
          const gesture = gestureRef.current;
          if (!gesture || gesture.pointerId !== e.pointerId) return;

          const shouldCommit = gesture.progress > 0.38;
          setFlipState({
            direction: gesture.direction,
            progress: shouldCommit ? 1 : 0,
            settling: true,
          });

          if (settleTimerRef.current !== null)
            window.clearTimeout(settleTimerRef.current);

          // Settle gracefully mimicking 3D page drops
          settleTimerRef.current = window.setTimeout(() => {
            if (shouldCommit) {
              if (gesture.direction === "next") onNext();
              else onPrev();
            } else {
              setFlipState(null);
            }
            gestureRef.current = null;
            settleTimerRef.current = null;
          }, 350);

          if (bookRef.current?.hasPointerCapture(e.pointerId)) {
            bookRef.current.releasePointerCapture(e.pointerId);
          }
        }}
        onPointerCancel={(e) => {
          const gesture = gestureRef.current;
          if (!gesture || gesture.pointerId !== e.pointerId) return;

          if (settleTimerRef.current !== null) {
            window.clearTimeout(settleTimerRef.current);
            settleTimerRef.current = null;
          }
          gestureRef.current = null;
          setFlipState(null);

          if (bookRef.current?.hasPointerCapture(e.pointerId)) {
            bookRef.current.releasePointerCapture(e.pointerId);
          }
        }}
      >
        <div
          className="absolute inset-0 bg-white shadow-2xl rounded-3xl overflow-visible flex"
          style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
        >
          {/* Background Left View Page */}
          <div className="absolute top-0 bottom-0 left-0 w-1/2 z-0">
            <BookPage side="left" item={staticLeftItem} getYear={getYear} />
            {isNext && (
              <div
                className="absolute inset-0 bg-black pointer-events-none rounded-l-3xl"
                style={{ opacity: dragProgress * 0.15 }}
              />
            )}
          </div>

          {/* Background Right View Page */}
          <div className="absolute top-0 bottom-0 right-0 w-1/2 z-0">
            <BookPage side="right" item={staticRightItem} getYear={getYear} />
            {isPrev && (
              <div
                className="absolute inset-0 bg-black pointer-events-none rounded-r-3xl"
                style={{ opacity: dragProgress * 0.15 }}
              />
            )}
          </div>

          {/* Simulated Inner Spine / Deep Center Crease */}
          <div
            className="absolute top-0 bottom-0 z-10 pointer-events-none mix-blend-multiply"
            style={{
              left: "calc(50% - 30px)",
              width: "60px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.02) 35%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.02) 65%, transparent 100%)",
            }}
          />

          {/* The Turning Page Element */}
          {activeDirection && (
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none"
              style={{
                width: "50%",
                left: isNext ? "50%" : "0",
                transformOrigin: isNext ? "left center" : "right center",
                transform: `rotateY(${isNext ? -180 * dragProgress : 180 * dragProgress}deg)`,
                transformStyle: "preserve-3d",
                WebkitTransformStyle: "preserve-3d",
                transition: flipState?.settling
                  ? "transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)"
                  : "none",
              }}
            >
              {/* Turn Page Front */}
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <BookPage
                  side={isNext ? "right" : "left"}
                  item={flipFrontItem}
                  getYear={getYear}
                />
                <div
                  className={`absolute inset-0 bg-black ${isNext ? "rounded-r-3xl" : "rounded-l-3xl"}`}
                  style={{ opacity: dragProgress * 0.22 }}
                />
              </div>

              {/* Turn Page Back */}
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                {/* 
                  When flipped 180deg across its parent's origin, 
                  it'll align perfectly opposite. Passing inverted 'side' aligns the round borders perfectly 
                */}
                <BookPage
                  side={isNext ? "left" : "right"}
                  item={flipBackItem}
                  getYear={getYear}
                />
                <div
                  className={`absolute inset-0 bg-black ${isNext ? "rounded-l-3xl" : "rounded-r-3xl"}`}
                  style={{ opacity: (1 - dragProgress) * 0.22 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Album Navigation Footers */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-30 shadow-sm"
          style={{
            borderColor: "#e5e7eb",
            background: "white",
            color: "#334155",
          }}
        >
          <AppIcon name="back" size={16} />
          Previous page
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isLast}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-30 shadow-sm"
          style={{
            borderColor: "#e5e7eb",
            background: "white",
            color: "#334155",
          }}
        >
          Next page
          <AppIcon
            name="back"
            size={16}
            style={{ transform: "rotate(180deg)" }}
          />
        </button>
      </div>
    </div>
  );
};

// ── Shared Page Card for The Album View ────────────────────────────────
const BookPage: React.FC<{
  side: "left" | "right";
  item: GalleryItem | null;
  getYear: (item: GalleryItem | null) => string;
}> = ({ side, item, getYear }) => {
  const isLeft = side === "left";
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    setImgErr(false);
  }, [item?.id]);

  return (
    <div
      className="flex flex-col h-full bg-white relative overflow-hidden"
      style={{
        borderRadius: isLeft ? "24px 0 0 24px" : "0 24px 24px 0",
      }}
    >
      {item ? (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden relative">
            {imgErr ? (
              <div
                className="flex flex-col items-center justify-center text-gray-300 h-full"
                style={{ background: "#f3f4f6" }}
              >
                <AppIcon name="gallery" size={32} />
                <span className="mt-2 text-sm font-medium">
                  Image unavailable
                </span>
              </div>
            ) : (
              <img
                src={item.imageUrl}
                alt={item.title}
                onError={() => setImgErr(true)}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false} // Disable default image drag interactions
              />
            )}
          </div>
          <div
            className="p-5 border-t"
            style={{ borderColor: "#e5e7eb", background: "white" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              {getYear(item)}
            </p>
            <p className="text-gray-900 font-black text-sm leading-snug line-clamp-1 mt-1">
              {item.title}
            </p>
            <p className="text-gray-600 text-xs leading-relaxed mt-2 line-clamp-2">
              {item.description || ""}
            </p>
          </div>
        </div>
      ) : (
        <div
          className="flex items-center justify-center h-full text-gray-300"
          style={{ background: "#f8fafc" }}
        >
          <AppIcon name="gallery" size={48} />
        </div>
      )}

      {/* Subtle Inner Highlight near the spine */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-multiply"
        style={{
          boxShadow: isLeft
            ? "inset -4px 0 12px rgba(0,0,0,0.03)"
            : "inset 4px 0 12px rgba(0,0,0,0.03)",
        }}
      />
    </div>
  );
};

export default Gallery;
