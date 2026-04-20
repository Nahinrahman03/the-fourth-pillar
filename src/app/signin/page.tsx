import { redirect } from "next/navigation";

import { SignInPanel } from "@/components/sign-in-panel";
import { getCurrentUser } from "@/lib/auth";

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard/profile");
  }

  return (
    <section className="auth-stage">
      <SignInPanel />
    </section>
  );
}
