import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser, identityDef } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";

export const metadata: Metadata = {
  title: "Things AI Can't Do",
  description: "A community catalog of things AI can't do — ask, answer, discover.",
};

async function HeaderAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="header-actions">
        <Link href="/login" className="btn">
          Sign in
        </Link>
        <Link href="/register" className="btn btn-primary">
          Sign up
        </Link>
      </div>
    );
  }
  const def = identityDef(user.identity);
  return (
    <div className="header-actions">
      <span className="user-chip">
        <span className="badge">{def?.emoji}</span> {user.username}
      </span>
      <form action={logoutAction}>
        <button type="submit" className="btn">
          Sign out
        </button>
      </form>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              Things AI Can&apos;t Do
            </Link>
            <HeaderAuth />
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container">
            A community catalog of AI&apos;s limits. Anyone can ask, anyone can answer.
          </div>
        </footer>
      </body>
    </html>
  );
}
