import { sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase/config";

const Login: React.FC = () => {
  const { login, role } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      setTimeout(() => {
        const r = localStorage.getItem("rl_role_hint");
        if (r === "admin") navigate("/admin");
        else navigate("/collaborator-portal");
      }, 400);
    } catch (err: any) {
      setError(
        err.code === "auth/invalid-credential" ||
          err.code === "auth/wrong-password"
          ? "Invalid email or password."
          : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Step 1: check email field is filled
    if (!form.email) {
      setError("Please enter your email address first.");
      return;
    }

    setResetLoading(true);
    setError("");
    setResetSent(false);

    try {
      // Step 2: check if email exists in Firestore
      const q = query(
        collection(db, "users"),
        where("email", "==", form.email),
      );
      const snap = await getDocs(q);

      // Step 3: if not found, show error and stop
      if (snap.empty) {
        setError("No account found with this email address.");
        setResetLoading(false);
        return;
      }

      // Step 4: email exists, send reset email
      await sendPasswordResetEmail(auth, form.email);
      setResetSent(true);
      setError("");
    } catch (err: any) {
      setError("Could not send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  React.useEffect(() => {
    if (role === "admin") navigate("/admin", { replace: true });
    else if (role === "collaborator")
      navigate("/collaborator-portal", { replace: true });
  }, [role]);

  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div
          className="px-8 py-7 text-center"
          style={{ background: "var(--color-primary)" }}
        >
          <h1
            className="text-white font-black text-2xl mb-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Portal Login
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            Syed's Lab — Admin & Collaborator Access
          </p>
        </div>

        <form onSubmit={submit} className="px-8 py-8 flex flex-col gap-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              className="w-full px-4 py-2.5 text-sm rounded-xl border outline-none"
              style={{ borderColor: "#d1d5db" }}
              placeholder="you@example.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                className="w-full px-4 py-2.5 text-sm rounded-xl border outline-none pr-10"
                style={{ borderColor: "#d1d5db" }}
                placeholder="••••••••"
              />
              {/* Show/Hide Password Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Forgot Password link */}
            <div className="text-right mt-1.5">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-xs font-semibold hover:underline disabled:opacity-60"
                style={{
                  color: "var(--color-secondary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {resetLoading ? "Sending..." : "Forgot password?"}
              </button>
            </div>
          </div>

          {/* Success message */}
          {resetSent && (
            <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
              Password reset email sent. Check your inbox and spam.
            </p>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-black py-3 rounded-xl text-white text-sm disabled:opacity-60 mt-1"
            style={{
              background: "var(--color-primary)",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-xs text-gray-400 mt-2">
            Not a collaborator yet?{" "}
            <a
              href="/collaborators"
              className="font-semibold no-underline hover:underline"
              style={{ color: "var(--color-secondary)" }}
            >
              Submit a request
            </a>{" "}
            on the Collaborators page.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
