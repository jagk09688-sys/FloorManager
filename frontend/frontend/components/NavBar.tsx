"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import GlobalSearch from "./GlobalSearch";
import { logout, getUser, type AuthUser } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/",          label: "Home"      },
  { href: "/jobs",      label: "Jobs"      },
  { href: "/schedule",  label: "Schedule"  },
  { href: "/products",  label: "Products"  },
  { href: "/loans",     label: "Loans"     },
  { href: "/new",       label: "+ New Job" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => { setUser(getUser()); }, []);

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      background: "#ffffff",
      borderBottom: "1px solid #e5e7eb",
      padding: "0 24px",
      height: 52,
      fontFamily: "var(--font-geist-sans), sans-serif",
      position: "sticky",
      top: 0,
      zIndex: 200,
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginRight: 32 }}>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#1d4ed8",
          border: "2px solid #1d4ed8",
          borderRadius: 6,
          padding: "4px 10px",
          letterSpacing: 0.5,
        }}>
          FLOORMANAGER
        </span>
      </Link>

      {/* Global search */}
      <div style={{ marginLeft: "auto", marginRight: 16 }}>
        <GlobalSearch />
      </div>

      {/* User + logout */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 8 }}>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            {user.fullName || user.email}
          </span>
          <button
            onClick={logout}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 12px",
              background: "none",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      )}

      {/* Nav links */}
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            style={{
              textDecoration: "none",
              padding: "0 16px",
              height: "100%",
              display: "flex",
              alignItems: "center",
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? "#1d4ed8" : "#6b7280",
              borderBottom: active ? "2px solid #1d4ed8" : "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
