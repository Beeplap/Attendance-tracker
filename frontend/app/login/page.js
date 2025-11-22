"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data.user) {
        // Fetch profile to determine redirect
        const { data: profileData } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profileData) {
          switch (profileData.role) {
            case "admin":
              router.replace("/admin");
              break;
            case "teacher":
              router.replace("/teacher");
              break;
            default:
              router.replace("/dashboard");
          }
        } else {
          router.replace("/dashboard");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (magicLinkError) {
        setError(magicLinkError.message);
        return;
      }

      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {magicLinkSent ? (
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Check your email
            </h2>
            <p className="text-gray-600 mb-4">
              We've sent a magic link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Click the link in the email to sign in.
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setEmail("");
              }}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            {/* Toggle between email/password and magic link */}
            <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setIsMagicLink(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  !isMagicLink
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Email & Password
              </button>
              <button
                onClick={() => setIsMagicLink(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  isMagicLink
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Magic Link
              </button>
            </div>

            <form
              onSubmit={isMagicLink ? handleMagicLink : handleEmailSignIn}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              {!isMagicLink && (
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                </div>
              )}

              {error && (
                <div
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading
                  ? "Signing in..."
                  : isMagicLink
                  ? "Send Magic Link"
                  : "Sign In"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

