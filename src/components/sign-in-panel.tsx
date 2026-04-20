"use client";

import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { firebaseAuth, googleProvider } from "@/lib/firebase";

const ERROR_MESSAGES: Record<string, string> = {
  "auth/popup-closed-by-user": "Sign-in was cancelled. Please try again.",
  "auth/popup-blocked": "Popup was blocked. Trying redirect method instead…",
  "auth/cancelled-popup-request": "Another sign-in is already in progress.",
  "auth/network-request-failed": "Network error. Please check your connection.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/unauthorized-domain": "This domain is not authorised in Firebase. Please contact support.",
};

export function SignInPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle redirect result when the page loads (after signInWithRedirect)
  useEffect(() => {
    let cancelled = false;

    async function handleRedirect() {
      try {
        const result = await getRedirectResult(firebaseAuth);
        if (!result || cancelled) return;

        setLoading(true);
        const idToken = await result.user.getIdToken();
        const response = await signIn("firebase", { idToken, redirect: false });

        if (response?.error) {
          setError("Authentication failed. Please try again.");
          setLoading(false);
          return;
        }

        router.push("/dashboard/profile");
        router.refresh();
      } catch {
        // No redirect result — normal page load, do nothing
      }
    }

    void handleRedirect();
    return () => { cancelled = true; };
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // First try the popup (faster UX)
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await signIn("firebase", { idToken, redirect: false });

      if (response?.error) {
        setError("Authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/dashboard/profile");
      router.refresh();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";

      // If popup is blocked, fall back to redirect
      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
        setError("Popup was blocked — redirecting to Google sign-in…");
        setTimeout(() => {
          void signInWithRedirect(firebaseAuth, googleProvider);
        }, 800);
        return;
      }

      setError(ERROR_MESSAGES[code] ?? "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-card stack">
      <div className="stack">
        <h2 className="page-title compact">Access Account</h2>
        <p className="page-subtitle narrow">
          Authentication required for restricted functional archives.
        </p>
      </div>

      <div className="stack">
        <button
          className="firebase-signin-btn"
          disabled={loading}
          onClick={() => void handleGoogleSignIn()}
          type="button"
        >
          {/* Google Logo */}
          <svg aria-hidden="true" height="20" viewBox="0 0 18 18" width="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
            <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.172.282-1.712V4.956H.957a8.996 8.996 0 000 8.088l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.048.957 4.956l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>

          <span>{loading ? "Signing in…" : "Continue with Google"}</span>

          {loading && <span className="firebase-spinner" aria-hidden="true" />}
        </button>

        {error ? (
          <p className="firebase-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <p className="helper">
        We use Google via Firebase for secure authentication. Your account is managed by
        The Fourth Pillar.
      </p>
    </div>
  );
}
