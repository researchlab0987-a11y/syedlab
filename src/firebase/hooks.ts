import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import type {
  Announcement,
  Comment as AppComment,
  CollaboratorProfile,
  Publication,
  ResearchIdea,
  SiteContent,
  ThemeSettings,
} from "../types";
import { db } from "./config";

import type { GalleryItem } from "../types";

// ── Site Content ──────────────────────────────────────────────
export function useSiteContent() {
  const [content, setContent] = useState<Partial<SiteContent>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "siteContent"), (snap) => {
      const data: Partial<SiteContent> = {};
      snap.forEach((d) => {
        data[d.id as keyof SiteContent] = d.data().value as string;
      });
      setContent(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { content, loading };
}

// ── Theme ─────────────────────────────────────────────────────
export function useTheme() {
  const [theme, setTheme] = useState<ThemeSettings>({
    primaryColor: "#1e3a5f",
    secondaryColor: "#2563eb",
    accentColor: "#f59e0b",
    backgroundColor: "#f8fafc",
    navbarColor: "#1e3a5f",
    footerColor: "#111827",
    fontFamily: "'Inter', sans-serif",
    headingFont: "'Inter', sans-serif",
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "theme", "settings"), (snap) => {
      if (snap.exists()) setTheme(snap.data() as ThemeSettings);
    });
    return unsub;
  }, []);

  return theme;
}

// ── Collaborators ─────────────────────────────────────────────
// No compound query — filter and sort on client to avoid composite index requirement
export function useCollaborators() {
  const [collaborators, setCollaborators] = useState<CollaboratorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "collaborators"),
      (snap) => {
        const all = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as CollaboratorProfile,
        );
        const filtered = all
          .filter((c) => c.isActive === true)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setCollaborators(filtered);
        setLoading(false);
      },
      (error) => {
        console.error("Collaborators error:", error);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { collaborators, loading };
}

// ── Publications ──────────────────────────────────────────────
export function usePublications() {
  const [ongoing, setOngoing] = useState<Publication[]>([]);
  const [published, setPublished] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "publications"),
      (snap) => {
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Publication)
          .sort((a, b) => b.year - a.year);
        setOngoing(all.filter((p) => p.type === "ongoing"));
        setPublished(all.filter((p) => p.type === "published"));
        setLoading(false);
      },
      (error) => {
        console.error("Publications error:", error);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { ongoing, published, loading };
}

// ── Research Ideas ────────────────────────────────────────────
export function useResearchIdeas() {
  const [ideas, setIdeas] = useState<ResearchIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "researchIdeas"),
      (snap) => {
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as ResearchIdea)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setIdeas(all);
        setLoading(false);
      },
      (error) => {
        console.error("Research ideas error:", error);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { ideas, loading };
}

// ── Comments for an idea ──────────────────────────────────────
export function useComments(ideaId: string) {
  const [comments, setComments] = useState<AppComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ideaId) return;
    const unsub = onSnapshot(
      query(collection(db, "comments"), where("ideaId", "==", ideaId)),
      (snap) => {
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as AppComment)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        setComments(all);
        setLoading(false);
      },
      (error) => {
        console.error("Comments error:", error);
        setLoading(false);
      },
    );
    return unsub;
  }, [ideaId]);

  return { comments, loading };
}

// ── Announcements ─────────────────────────────────────────────
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "announcements"),
      (snap) => {
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Announcement)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setAnnouncements(all);
      },
      (error) => {
        console.error("Announcements error:", error);
      },
    );
    return unsub;
  }, []);

  return announcements;
}

// ── Single collaborator profile by uid ────────────────────────
export async function getCollaboratorByUid(
  uid: string,
): Promise<CollaboratorProfile | null> {
  const q = query(collection(db, "collaborators"), where("uid", "==", uid));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as CollaboratorProfile;
}

// ── Gallery ───────────────────────────────────────────────────
export function useGallery() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "gallery"),
      (snap) => {
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as GalleryItem)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setGallery(all);
        setLoading(false);
      },
      (error) => {
        console.error("Gallery error:", error);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { gallery, loading };
}
