import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import AppIcon, { type AppIconName } from "./AppIcon";

// Persist navbar mode in localStorage
const STORAGE_KEY = "rl_navbar_mode";
type NavMode = "horizontal" | "vertical";

const Navbar: React.FC = () => {
  const { role, logout, appUser } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [collaboratorPhoto, setCollaboratorPhoto] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);
  const [navMode, setNavMode] = useState<NavMode>(() => {
    return (localStorage.getItem(STORAGE_KEY) as NavMode) ?? "horizontal";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isVertical = navMode === "vertical";

  const navLinks = [
    { to: "/", label: "Home", icon: "home" as AppIconName },
    { to: "/about", label: "About", icon: "about" as AppIconName },
    {
      to: "/collaborators",
      label: "Collaborators",
      icon: "collaborators" as AppIconName,
    },
    {
      to: "/publications",
      label: "Publications",
      icon: "publications" as AppIconName,
    },
    {
      to: "/research-ideas",
      label: "Research Ideas",
      icon: "ideas" as AppIconName,
    },
    { to: "/gallery", label: "Gallery", icon: "gallery" as AppIconName },
    { to: "/contact", label: "Contact", icon: "contact" as AppIconName },
  ];

  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const toggleMode = () => {
    const next: NavMode = navMode === "horizontal" ? "vertical" : "horizontal";
    setNavMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (role !== "collaborator" || !appUser?.uid) return;
    getDocs(
      query(collection(db, "collaborators"), where("uid", "==", appUser.uid)),
    )
      .then((snap) => {
        if (!snap.empty) setCollaboratorPhoto(snap.docs[0].data().photo ?? "");
      })
      .catch(() => {});
  }, [role, appUser?.uid]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Keep global layout in sync so desktop content is pushed by sidebar width.
  useEffect(() => {
    const body = document.body;
    if (isVertical) {
      body.classList.add("nav-vertical");
      body.style.setProperty(
        "--app-sidebar-width",
        sidebarCollapsed ? "64px" : "220px",
      );
    } else {
      body.classList.remove("nav-vertical");
      body.style.setProperty("--app-sidebar-width", "0px");
    }

    return () => {
      body.classList.remove("nav-vertical");
      body.style.setProperty("--app-sidebar-width", "0px");
    };
  }, [isVertical, sidebarCollapsed]);

  const initials = appUser?.name
    ? appUser.name
        .split(" ")
        .map((w: string) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";
  const avatarPhoto = role === "collaborator" ? collaboratorPhoto : "";

  // ── VERTICAL SIDEBAR MODE ──────────────────────────────────
  if (isVertical) {
    return (
      <>
        <style>{`
          @keyframes dropdownFade {
            from { opacity:0; transform:translateY(-8px) scale(0.97); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
          .sidebar-tooltip {
            position: absolute;
            left: 56px;
            background: #1e293b;
            color: white;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 8px;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.15s ease;
            z-index: 999;
          }
          .sidebar-icon-btn:hover .sidebar-tooltip { opacity: 1; }
        `}</style>

        {/* Fixed vertical sidebar */}
        <aside
          className="fixed top-0 left-0 h-screen z-50 flex flex-col hidden lg:flex"
          style={{
            width: sidebarCollapsed ? 64 : 220,
            background: "var(--color-navbar)",
            boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
            transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-4 flex-shrink-0"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              minHeight: 64,
            }}
          >
            {!sidebarCollapsed && (
              <Link
                to="/"
                className="flex items-center gap-2 no-underline flex-1 min-w-0"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent), #f97316)",
                    color: "#1f2937",
                  }}
                >
                  R
                </div>
                <span
                  style={{
                    color: "var(--color-accent)",
                    fontFamily: "var(--font-heading)",
                    fontSize: 15,
                  }}
                  className="font-black truncate"
                >
                  Syed's Lab
                </span>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link to="/" className="mx-auto no-underline">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent), #f97316)",
                    color: "#1f2937",
                  }}
                >
                  R
                </div>
              </Link>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border-none cursor-pointer ml-2"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: 13,
                }}
                title="Collapse sidebar"
              >
                ‹
              </button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="mx-auto mt-2 w-8 h-8 rounded-lg flex items-center justify-center border-none cursor-pointer flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "white",
                fontSize: 13,
              }}
              title="Expand sidebar"
            >
              ›
            </button>
          )}

          {/* Nav links */}
          <nav
            className="flex-1 py-3 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {navLinks.map((l) => {
              const active = isActive(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className="sidebar-icon-btn relative flex items-center gap-3 mx-2 px-2 py-2.5 rounded-xl mb-1 no-underline transition-all"
                  style={{
                    background: active
                      ? "rgba(255,255,255,0.12)"
                      : "transparent",
                    color: active
                      ? "var(--color-accent)"
                      : "rgba(255,255,255,0.75)",
                    fontWeight: active ? 700 : 500,
                    fontSize: 13.5,
                    borderLeft: active
                      ? "3px solid var(--color-accent)"
                      : "3px solid transparent",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  }}
                >
                  <AppIcon name={l.icon} size={17} style={{ flexShrink: 0 }} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{l.label}</span>
                  )}
                  {sidebarCollapsed && (
                    <span className="sidebar-tooltip">{l.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom: mode toggle + user */}
          <div
            className="flex-shrink-0 px-2 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
          >
            {/* Switch to horizontal */}
            <button
              onClick={toggleMode}
              className="sidebar-icon-btn relative w-full flex items-center gap-3 px-2 py-2.5 rounded-xl border-none cursor-pointer mb-2 transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
              }}
            >
              <AppIcon name="switch" size={15} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span>Switch to Top Bar</span>}
              {sidebarCollapsed && (
                <span className="sidebar-tooltip">Switch to Top Bar</span>
              )}
            </button>

            {/* User / login */}
            {role === "admin" || role === "collaborator" ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="sidebar-icon-btn relative w-full flex items-center gap-2 px-2 py-2 rounded-xl border-none cursor-pointer"
                  style={{
                    background: dropdownOpen
                      ? "rgba(255,255,255,0.12)"
                      : "transparent",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  }}
                >
                  <AvatarCircle
                    photo={avatarPhoto}
                    initials={initials}
                    size={30}
                  />
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-white text-xs font-black truncate">
                        {appUser?.name?.split(" ")[0]}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{
                          color: "rgba(255,255,255,0.45)",
                          fontSize: 10,
                        }}
                      >
                        {role}
                      </p>
                    </div>
                  )}
                  {sidebarCollapsed && (
                    <span className="sidebar-tooltip">{appUser?.name}</span>
                  )}
                </button>
                {dropdownOpen && (
                  <div
                    className="absolute rounded-2xl overflow-hidden"
                    style={{
                      bottom: "100%",
                      left: sidebarCollapsed ? 68 : 0,
                      width: 260,
                      background: "white",
                      boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
                      border: "1px solid #e5e7eb",
                      animation: "dropdownFade 0.18s ease",
                      marginBottom: 8,
                    }}
                  >
                    <UserDropdownContent
                      appUser={appUser}
                      role={role}
                      avatarPhoto={avatarPhoto}
                      initials={initials}
                      onClose={() => setDropdownOpen(false)}
                      onLogout={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="sidebar-icon-btn relative no-underline flex items-center gap-2 px-2 py-2.5 rounded-xl font-bold text-xs"
                style={{
                  background: "var(--color-accent)",
                  color: "#1f2937",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                }}
              >
                <AppIcon name="login" size={15} />
                {!sidebarCollapsed && <span>Portal Login</span>}
                {sidebarCollapsed && (
                  <span className="sidebar-tooltip">Portal Login</span>
                )}
              </Link>
            )}
          </div>
        </aside>

        {/* Mobile navbar stays horizontal */}
        <HorizontalNav
          navLinks={navLinks}
          isActive={isActive}
          role={role}
          appUser={appUser}
          avatarPhoto={avatarPhoto}
          initials={initials}
          scrolled={scrolled}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          dropdownRef={dropdownRef}
          logout={logout}
          toggleMode={toggleMode}
          navMode={navMode}
          className="lg:hidden"
        />
      </>
    );
  }

  // ── HORIZONTAL MODE (default) ──────────────────────────────
  return (
    <HorizontalNav
      navLinks={navLinks}
      isActive={isActive}
      role={role}
      appUser={appUser}
      avatarPhoto={avatarPhoto}
      initials={initials}
      scrolled={scrolled}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      dropdownOpen={dropdownOpen}
      setDropdownOpen={setDropdownOpen}
      dropdownRef={dropdownRef}
      logout={logout}
      toggleMode={toggleMode}
      navMode={navMode}
    />
  );
};

// ── Horizontal Navbar ──────────────────────────────────────────
const HorizontalNav: React.FC<{
  navLinks: { to: string; label: string; icon: AppIconName }[];
  isActive: (p: string) => boolean;
  role: any;
  appUser: any;
  avatarPhoto: string;
  initials: string;
  scrolled: boolean;
  menuOpen: boolean;
  setMenuOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  dropdownOpen: boolean;
  setDropdownOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  logout: () => void;
  toggleMode: () => void;
  navMode: NavMode;
  className?: string;
}> = ({
  navLinks,
  isActive,
  role,
  appUser,
  avatarPhoto,
  initials,
  scrolled,
  menuOpen,
  setMenuOpen,
  dropdownOpen,
  setDropdownOpen,
  dropdownRef,
  logout,
  toggleMode,
  navMode,
  className = "",
}) => (
  <>
    <style>{`
      @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      @keyframes dropdownFade { from{opacity:0;transform:translateY(-8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      .nav-link-pill { transition: color 0.15s, background 0.15s; }
      .nav-link-pill:hover { background: rgba(255,255,255,0.1) !important; }
      .hamburger-line { display:block; width:22px; height:2px; border-radius:99px; background:white; transition:transform 0.3s ease, opacity 0.3s ease, width 0.3s ease; transform-origin:center; }
    `}</style>

    <nav
      className={className}
      style={{
        background: "var(--color-navbar)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: scrolled
          ? "0 4px 24px rgba(0,0,0,0.18)"
          : "0 2px 8px rgba(0,0,0,0.1)",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 no-underline flex-shrink-0"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-accent), #f97316)",
                color: "#1f2937",
                boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
              }}
            >
              R
            </div>
            <span
              style={{
                color: "var(--color-accent)",
                fontFamily: "var(--font-heading)",
              }}
              className="text-xl font-black tracking-tight"
            >
              Syed's
            </span>
            <span className="text-white text-xl font-black tracking-tight">
              Lab
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="nav-link-pill no-underline px-3.5 py-2 rounded-lg text-sm"
                style={{
                  color: isActive(l.to)
                    ? "var(--color-accent)"
                    : "rgba(255,255,255,0.82)",
                  fontWeight: isActive(l.to) ? 700 : 500,
                  background: isActive(l.to)
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                  borderBottom: isActive(l.to)
                    ? "2px solid var(--color-accent)"
                    : "2px solid transparent",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Toggle to vertical */}
            <button
              onClick={toggleMode}
              title="Switch to vertical sidebar"
              className="w-8 h-8 rounded-lg flex items-center justify-center border-none cursor-pointer transition-all"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.16)";
                (e.currentTarget as HTMLElement).style.color = "white";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.6)";
              }}
            >
              <AppIcon name="menu" size={15} />
            </button>

            {!role && (
              <Link
                to="/login"
                className="no-underline text-xs font-bold px-4 py-2 rounded-lg"
                style={{
                  color: "#1f2937",
                  background: "var(--color-accent)",
                  boxShadow: "0 2px 8px rgba(245,158,11,0.35)",
                }}
              >
                Portal Login
              </Link>
            )}

            {(role === "admin" || role === "collaborator") && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2.5 rounded-full border-none cursor-pointer px-2 py-1"
                  style={{
                    background: dropdownOpen
                      ? "rgba(255,255,255,0.18)"
                      : "rgba(255,255,255,0.08)",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                  }}
                >
                  <AvatarCircle
                    photo={avatarPhoto}
                    initials={initials}
                    size={32}
                  />
                  <div className="text-left hidden xl:block">
                    <p
                      className="text-white text-xs font-bold leading-tight"
                      style={{ maxWidth: 100 }}
                    >
                      {appUser?.name?.split(" ")[0]}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {role}
                    </p>
                  </div>
                  <span
                    className="text-white text-xs opacity-60"
                    style={{
                      transform: dropdownOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  >
                    ▾
                  </span>
                </button>
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 rounded-2xl overflow-hidden"
                    style={{
                      width: 280,
                      background: "white",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                      border: "1px solid #e5e7eb",
                      zIndex: 200,
                      animation: "dropdownFade 0.18s ease",
                    }}
                  >
                    <UserDropdownContent
                      appUser={appUser}
                      role={role}
                      avatarPhoto={avatarPhoto}
                      initials={initials}
                      onClose={() => setDropdownOpen(false)}
                      onLogout={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            {(role === "admin" || role === "collaborator") && (
              <AvatarCircle photo={avatarPhoto} initials={initials} size={32} />
            )}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex flex-col items-center justify-center gap-1.5 w-10 h-10 rounded-xl border-none cursor-pointer"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <span
                className="hamburger-line"
                style={{
                  transform: menuOpen
                    ? "translateY(6px) rotate(45deg)"
                    : "none",
                }}
              />
              <span
                className="hamburger-line"
                style={{
                  opacity: menuOpen ? 0 : 1,
                  width: menuOpen ? "0" : "22px",
                }}
              />
              <span
                className="hamburger-line"
                style={{
                  transform: menuOpen
                    ? "translateY(-6px) rotate(-45deg)"
                    : "none",
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile backdrop */}
    {menuOpen && (
      <div
        className="fixed inset-0 z-40 lg:hidden"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.2s ease",
        }}
        onClick={() => setMenuOpen(false)}
      />
    )}

    {/* Mobile drawer */}
    <div
      className="fixed top-0 right-0 h-full z-50 lg:hidden flex flex-col"
      style={{
        width: "min(320px, 85vw)",
        background: "var(--color-primary)",
        transform: menuOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
        overflowY: "auto",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 no-underline"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent), #f97316)",
              color: "#1f2937",
            }}
          >
            R
          </div>
          <span
            style={{
              color: "var(--color-accent)",
              fontFamily: "var(--font-heading)",
            }}
            className="font-black"
          >
            Syed's Lab
          </span>
        </Link>
        <button
          onClick={() => setMenuOpen(false)}
          className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer text-white text-lg"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          ×
        </button>
      </div>

      {(role === "admin" || role === "collaborator") && appUser && (
        <div
          className="mx-4 mt-4 rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <AvatarCircle photo={avatarPhoto} initials={initials} size={44} />
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm truncate">
                {appUser.name}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {appUser.email}
              </p>
              <span
                className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background:
                    role === "admin"
                      ? "var(--color-accent)"
                      : "rgba(255,255,255,0.15)",
                  color: role === "admin" ? "#1f2937" : "white",
                }}
              >
                {role === "admin" ? "Administrator" : "Collaborator"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 px-4 py-4">
        <p
          className="text-xs font-black uppercase tracking-widest mb-3 px-2"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          Navigation
        </p>
        {navLinks.map((l) => {
          const active = isActive(l.to);
          return (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className="no-underline flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
              style={{
                background: active ? "rgba(255,255,255,0.12)" : "transparent",
                color: active ? "var(--color-accent)" : "rgba(255,255,255,0.8)",
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                borderLeft: active
                  ? "3px solid var(--color-accent)"
                  : "3px solid transparent",
              }}
            >
              <AppIcon name={l.icon} size={16} />
              {l.label}
              {active && (
                <span
                  className="ml-auto text-xs"
                  style={{ color: "var(--color-accent)" }}
                >
                  ●
                </span>
              )}
            </Link>
          );
        })}

        {/* Switch mode */}
        <button
          onClick={toggleMode}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mt-3 border-none cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.6)",
            fontSize: 13,
          }}
        >
          <AppIcon name="menu" size={15} /> Switch to Vertical Sidebar
        </button>

        {(role === "admin" || role === "collaborator") && (
          <>
            <p
              className="text-xs font-black uppercase tracking-widest mb-3 mt-5 px-2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Portal
            </p>
            {role === "admin" && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="no-underline flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
                style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}
              >
                <AppIcon name="admin" size={15} /> Admin Dashboard
              </Link>
            )}
            {role === "collaborator" && (
              <Link
                to="/collaborator-portal"
                onClick={() => setMenuOpen(false)}
                className="no-underline flex items-center gap-3 px-3 py-3 rounded-xl mb-1"
                style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}
              >
                <AppIcon name="portal" size={15} /> My Portal
              </Link>
            )}
          </>
        )}
      </div>

      <div
        className="px-4 pb-6 flex-shrink-0 flex flex-col gap-2"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: 16,
        }}
      >
        {!role && (
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="no-underline flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
            style={{ background: "var(--color-accent)", color: "#1f2937" }}
          >
            <AppIcon name="login" size={15} /> Portal Login
          </Link>
        )}
        {(role === "admin" || role === "collaborator") && (
          <button
            onClick={() => {
              logout();
              setMenuOpen(false);
            }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-none cursor-pointer"
            style={{ background: "#fee2e2", color: "#991b1b" }}
          >
            <AppIcon name="logout" size={15} /> Sign Out
          </button>
        )}
      </div>
    </div>
  </>
);

// ── User Dropdown Content ──────────────────────────────────────
const UserDropdownContent: React.FC<{
  appUser: any;
  role: any;
  avatarPhoto: string;
  initials: string;
  onClose: () => void;
  onLogout: () => void;
}> = ({ appUser, role, avatarPhoto, initials, onClose, onLogout }) => (
  <>
    <div
      className="px-5 pt-5 pb-4"
      style={{ background: "var(--color-primary)" }}
    >
      <div className="flex items-center gap-3">
        <AvatarCircle photo={avatarPhoto} initials={initials} size={48} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm truncate">
            {appUser?.name ?? "User"}
          </p>
          <p
            className="text-xs mt-0.5 truncate"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {appUser?.email}
          </p>
          <span
            className="inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background:
                role === "admin"
                  ? "var(--color-accent)"
                  : "rgba(255,255,255,0.15)",
              color: role === "admin" ? "#1f2937" : "white",
            }}
          >
            {role === "admin" ? "Administrator" : "Collaborator"}
          </span>
        </div>
      </div>
    </div>
    <div className="py-2">
      {role === "admin" && (
        <DropdownItem
          to="/admin"
          icon="admin"
          label="Admin Dashboard"
          onClick={onClose}
        />
      )}
      {role === "collaborator" && (
        <DropdownItem
          to="/collaborator-portal"
          icon="portal"
          label="My Portal"
          onClick={onClose}
        />
      )}
      <DropdownItem
        to="/"
        icon="website"
        label="View Website"
        onClick={onClose}
      />
    </div>
    <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: "#f0f0f0" }}>
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer border-none text-left"
        style={{ background: "#fee2e2", color: "#991b1b" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#fecaca")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#fee2e2")}
      >
        <AppIcon name="logout" size={15} /> Sign Out
      </button>
    </div>
  </>
);

// ── Avatar Circle ──────────────────────────────────────────────
const AvatarCircle: React.FC<{
  photo: string;
  initials: string;
  size: number;
}> = ({ photo, initials, size }) => {
  const [err, setErr] = useState(false);
  if (photo && !err)
    return (
      <img
        src={photo}
        alt="avatar"
        onError={() => setErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          display: "block",
          flexShrink: 0,
        }}
      />
    );
  return (
    <div
      className="flex items-center justify-center text-white font-black flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "linear-gradient(135deg, var(--color-accent), var(--color-secondary))",
        fontSize: size * 0.36,
        userSelect: "none",
      }}
    >
      {initials}
    </div>
  );
};

// ── Dropdown Item ──────────────────────────────────────────────
const DropdownItem: React.FC<{
  to: string;
  icon: AppIconName;
  label: string;
  onClick: () => void;
}> = ({ to, icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="no-underline flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700"
    onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    <AppIcon name={icon} size={16} />
    {label}
  </Link>
);

export default Navbar;
