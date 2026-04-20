/**
 * Verifies a Firebase ID token using the Firebase Identity Toolkit REST API.
 * This avoids needing the Firebase Admin SDK / private key.
 *
 * Docs: https://firebase.google.com/docs/reference/rest/auth#section-get-account-info
 */
type FirebaseUser = {
  localId: string;      // Firebase UID
  email?: string;
  displayName?: string;
  photoUrl?: string;
  emailVerified?: boolean;
};

type LookupResponse = {
  users?: FirebaseUser[];
  error?: { message: string };
};

export async function verifyFirebaseToken(idToken: string): Promise<FirebaseUser | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      console.error("[firebase-verify] NEXT_PUBLIC_FIREBASE_API_KEY is not set");
      return null;
    }

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as LookupResponse;
      console.error("[firebase-verify] Token verification failed:", err.error?.message);
      return null;
    }

    const data = (await res.json()) as LookupResponse;
    return data.users?.[0] ?? null;
  } catch (err) {
    console.error("[firebase-verify] Unexpected error:", err);
    return null;
  }
}
