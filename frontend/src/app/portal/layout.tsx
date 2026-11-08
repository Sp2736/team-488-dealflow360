'use client';

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { withBasePath } from "@/lib/basePath";
import { ToastProvider } from "@/components/Toast";

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      router.replace(withBasePath('/login'));
    }
  };

  return (
    <ToastProvider>
      <div className="portal-container" style={{ minHeight: "100vh", backgroundColor: "var(--surface-sunken)" }}>
        <header className="portal-header" style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1.25rem", color: "var(--fg)" }}>DealFlow360 Portal</h2>
            <nav style={{ display: "flex", gap: "1.5rem" }}>
              <Link href="/portal/quotation" style={{ fontWeight: 600, color: "var(--fg-muted)", textDecoration: "none" }}>
                Quotations
              </Link>
              <Link href="/portal/messages" style={{ fontWeight: 600, color: "var(--fg-muted)", textDecoration: "none" }}>
                Messages
              </Link>
              <Link href="/portal/profile" style={{ fontWeight: 600, color: "var(--fg-muted)", textDecoration: "none" }}>
                Profile
              </Link>
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--fg-muted)" }}>
              Welcome, {user?.name || "Customer"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              Sign Out
            </button>
          </div>
        </header>

        <main style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
