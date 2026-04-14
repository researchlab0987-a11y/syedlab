import React from "react";
import { Link, useParams } from "react-router-dom";
import AppIcon from "../components/AppIcon";
import { useCollaborators } from "../firebase/hooks";

const CollaboratorProfilePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const { collaborators, loading } = useCollaborators();

  if (loading) {
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
  }

  const collaborator = collaborators.find((c) => c.uid === uid);

  if (!collaborator) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-gray-900">Profile not found</h1>
        <p className="mt-2 text-gray-500">
          This collaborator profile is not available.
        </p>
        <Link
          to="/collaborators"
          className="inline-flex mt-6 rounded-full px-5 py-2.5 text-sm font-bold text-white no-underline"
          style={{ background: "var(--color-primary)" }}
        >
          Back to Collaborators
        </Link>
      </div>
    );
  }

  const socialLinks = [
    {
      href: collaborator.linkedin,
      label: "LinkedIn",
      icon: "linkedin" as const,
    },
    {
      href: collaborator.scholar,
      label: "Google Scholar",
      icon: "scholar" as const,
    },
    { href: collaborator.orcid, label: "ORCID", icon: "orcid" as const },
    {
      href: collaborator.researchgate,
      label: "ResearchGate",
      icon: "researchgate" as const,
    },
    {
      href: collaborator.facebook,
      label: "Facebook",
      icon: "facebook" as const,
    },
  ].filter((link) => link.href);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div
        className="rounded-3xl border bg-white p-6 shadow-sm"
        style={{ borderColor: "#e5e7eb" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {collaborator.photo ? (
            <img
              src={collaborator.photo}
              alt={collaborator.name}
              className="h-24 w-24 rounded-2xl object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-3xl font-black">
              {collaborator.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-semibold">
              Collaborator
            </p>
            <h1 className="text-3xl font-black mt-1 text-gray-900">
              {collaborator.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {collaborator.designation} · {collaborator.affiliation}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t pt-6" style={{ borderColor: "#eef2f7" }}>
          <p
            className="text-sm leading-relaxed text-gray-700"
            style={{ whiteSpace: "pre-line" }}
          >
            {collaborator.bio}
          </p>
        </div>

        {collaborator.researchInterests?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-700 mb-2">
              Research Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {collaborator.researchInterests.map((interest) => (
                <span
                  key={interest}
                  className="text-xs rounded-full px-3 py-1"
                  style={{ background: "#eff6ff", color: "#1d4ed8" }}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {socialLinks.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Profiles</h3>
            <div className="flex items-center gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  title={link.label}
                  className="no-underline rounded-lg flex items-center justify-center transition-all"
                  style={{
                    width: 34,
                    height: 34,
                    background: "#ffffff",
                    border: "1px solid #111827",
                    color: "#111827",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 4px 12px rgba(17,24,39,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <AppIcon name={link.icon} size={16} />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link
            to="/collaborators"
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold no-underline"
            style={{ borderColor: "#dbe5dd", color: "var(--color-primary)" }}
          >
            <AppIcon name="back" size={14} />
            Back to Collaborators
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorProfilePage;
