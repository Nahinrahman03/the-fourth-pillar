"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <button className="button-ghost" disabled={loading} onClick={handleSignOut} type="button">
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
