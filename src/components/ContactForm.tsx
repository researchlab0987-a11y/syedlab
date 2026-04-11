import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import { db } from "../firebase/config";
import { useSiteContent } from "../firebase/hooks";
import AppIcon from "./AppIcon";

const ContactForm: React.FC = () => {
  const { content } = useSiteContent();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await addDoc(collection(db, "contactMessages"), {
        ...form,
        isRead: false,
        submittedAt: new Date().toISOString(),
      });
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="mb-4 inline-flex text-emerald-600">
          <AppIcon name="check" size={44} />
        </div>
        <h3
          className="font-black text-xl mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          Message Sent!
        </h3>
        <p className="text-gray-600">
          {content["contact.successMessage"] ??
            "Thank you for reaching out. We'll get back to you soon."}
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm font-semibold"
          style={{
            color: "var(--color-secondary)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-2.5 text-sm rounded-lg border outline-none transition-colors";
  const inputStyle = { borderColor: "#d1d5db", fontFamily: "var(--font-body)" };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className={inputClass}
            style={inputStyle}
            placeholder="Dr. Jane Smith"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Email *
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className={inputClass}
            style={inputStyle}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Subject
        </label>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          className={inputClass}
          style={inputStyle}
          placeholder="Research collaboration inquiry"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Message *
        </label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          className={inputClass}
          style={{ ...inputStyle, resize: "vertical" }}
          placeholder="Tell us about your research interests or inquiry..."
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="font-bold py-3 px-8 rounded-lg text-white text-sm disabled:opacity-60 transition-opacity"
        style={{
          background: "var(--color-primary)",
          border: "none",
          cursor: "pointer",
        }}
      >
        {submitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
};

export default ContactForm;
