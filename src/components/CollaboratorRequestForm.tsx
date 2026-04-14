import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import { db } from "../firebase/config";
import AppIcon from "./AppIcon";
import CloudinaryUpload from "./CloudinaryUpload";

const inputClassName =
  "w-full px-3 py-2 text-sm rounded-lg border outline-none";

const inputStyle: React.CSSProperties = {
  borderColor: "#d1d5db",
};

const LabeledInput: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <label className="block">
    <span
      className="block text-xs font-semibold mb-1"
      style={{ color: "#64748b" }}
    >
      {label}
    </span>
    {children}
  </label>
);

const CollaboratorRequestForm: React.FC = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    affiliation: "",
    designation: "",
    bio: "",
    photo: "",
    linkedin: "",
    orcid: "",
    scholar: "",
    researchgate: "",
    facebook: "",
    researchInterests: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.bio) {
      setError("Please fill all required fields.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await addDoc(collection(db, "pendingRequests"), {
        ...form,
        researchInterests: form.researchInterests
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        status: "pending",
        submittedAt: new Date().toISOString(),
      });
      setDone(true);
    } catch {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">🎉</div>
        <h3
          className="font-black text-xl mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          Request Submitted!
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Your application is under review. If approved, you will receive an
          email with your login credentials.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div
        className="rounded-xl p-3 text-xs text-blue-700"
        style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
      >
        <span className="inline-flex items-center gap-1.5">
          <AppIcon name="about" size={12} />
          If your request is approved, you will receive an email with your login
          credentials. Also Check the spam box. Don't give any wrong Email
          address. Otherwise, you will not receive the credentials. If you have
          any questions, please contact us at{" "}
          <a
            href="mailto:rahmanlab@gmail.com"
            className="text-blue-600 hover:underline"
          >
            rahmanlab@gmail.com
          </a>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LabeledInput label="Full Name *">
          <input
            required
            className={inputClassName}
            style={inputStyle}
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Dr. Jane Smith"
          />
        </LabeledInput>
        <LabeledInput label="Email *">
          <input
            required
            type="email"
            className={inputClassName}
            style={inputStyle}
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="jane@buet.ac.bd"
          />
        </LabeledInput>
        <LabeledInput label="Designation *">
          <input
            required
            className={inputClassName}
            style={inputStyle}
            value={form.designation}
            onChange={(e) => updateField("designation", e.target.value)}
            placeholder="Professor, PhD Student..."
          />
        </LabeledInput>
        <LabeledInput label="Affiliation *">
          <input
            required
            className={inputClassName}
            style={inputStyle}
            value={form.affiliation}
            onChange={(e) => updateField("affiliation", e.target.value)}
            placeholder="BUET, Dept. of CSE"
          />
        </LabeledInput>
      </div>

      <CloudinaryUpload
        label="Profile Photo"
        currentUrl={form.photo}
        onUpload={(r) => updateField("photo", r.secure_url)}
      />

      <LabeledInput label="Bio *">
        <textarea
          required
          rows={4}
          className={inputClassName}
          style={{ ...inputStyle, resize: "vertical" }}
          value={form.bio}
          onChange={(e) => updateField("bio", e.target.value)}
          placeholder="Brief description of your background..."
        />
      </LabeledInput>

      <LabeledInput label="Research Interests (comma separated)">
        <input
          className={inputClassName}
          style={inputStyle}
          value={form.researchInterests}
          onChange={(e) => updateField("researchInterests", e.target.value)}
          placeholder="Machine Learning, NLP, Computer Vision"
        />
      </LabeledInput>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(
          ["linkedin", "orcid", "scholar", "researchgate", "facebook"] as const
        ).map((key) => (
          <LabeledInput
            key={key}
            label={key.charAt(0).toUpperCase() + key.slice(1)}
          >
            <input
              className={inputClassName}
              style={inputStyle}
              value={form[key]}
              onChange={(e) => updateField(key, e.target.value)}
              placeholder="https://..."
            />
          </LabeledInput>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="text-sm font-bold px-6 py-2 rounded-lg text-white disabled:opacity-60"
          style={{
            background: "var(--color-primary)",
            border: "none",
            cursor: "pointer",
          }}
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </form>
  );
};

export default CollaboratorRequestForm;
