'use client';

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { withBasePath } from "@/lib/basePath";
import { ToastProvider } from "@/components/Toast";
import { RouteGuard } from "@/demo/ui/RouteGuard";

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
          borderBottom: "2px solid #000000",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: "1.25rem", color: "var(--fg)" }}>DEALFLOW360</h2>
              <span style={{ background: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '2px 6px', border: '1.5px solid #000', textTransform: 'uppercase' }}>
                CUSTOMER PORTAL
              </span>
            </div>
            <nav style={{ display: "flex", gap: "1.5rem" }}>
              <Link href={withBasePath("/portal/quotation")} style={{ fontWeight: 700, color: "var(--fg)", textDecoration: "none" }}>
                Quotations
              </Link>
              <Link href={withBasePath("/portal/messages")} style={{ fontWeight: 700, color: "var(--fg)", textDecoration: "none" }}>
                Messages
              </Link>
              <Link href={withBasePath("/portal/profile")} style={{ fontWeight: 700, color: "var(--fg)", textDecoration: "none" }}>
                Profile
              </Link>
              <Link href={withBasePath("/architecture")} style={{ fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>
                Architecture
              </Link>
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--fg)" }}>
              {user?.name || "Rachel Green"} ({user?.role || "CUSTOMER"})
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "12px", border: "2px solid #000", fontWeight: 800 }}
            >
              Sign Out
            </button>
          </div>
        </header>

        <main style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
          <RouteGuard>
            {children}
          </RouteGuard>
        </main>
      </div>
    </ToastProvider>
  );
}
