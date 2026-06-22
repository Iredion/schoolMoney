import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { api } from "./serviceAPI";
import {
  FaGraduationCap,
  FaHome,
  FaSchool,
  FaDonate,
  FaUserFriends,
  FaChartBar,
  FaShieldAlt,
  FaComments,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaWallet,
} from "react-icons/fa";

export default function Anchor() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = api.getUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If on login or register page, don't show layout
  const isAuthPage = location.pathname === "/" || location.pathname === "/register";
  if (isAuthPage) {
    return <Outlet />;
  }

  const isAdmin = user?.role === "ROLE_ADMIN";

  const navItems = [
    { to: "/home", label: "Strona główna", icon: <FaHome /> },
    { to: "/rodzicPanel", label: "Panel Rodzica", icon: <FaUserFriends /> },
    { to: "/klasa", label: "Klasy", icon: <FaSchool /> },
    { to: "/zbiorki", label: "Zbiórki", icon: <FaDonate /> },
    { to: "/skarbnikPanel", label: "Panel Skarbnika", icon: <FaChartBar /> },
    { to: "/chat", label: "Czat", icon: <FaComments /> },
  ];

  if (isAdmin) {
    navItems.push({ to: "/adminPanel", label: "Panel Admina", icon: <FaShieldAlt /> });
  }

  const handleLogout = () => {
    api.logout();
    navigate("/");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 40,
            display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          background: "linear-gradient(180deg, #F48C06 0%, #E07800 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "0",
          position: "fixed",
          top: 0,
          left: sidebarOpen ? 0 : -260,
          bottom: 0,
          zIndex: 50,
          transition: "left 0.3s ease",
          boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
        }}
        className="sidebar"
      >
        {/* Logo */}
        <div
          style={{
            padding: "24px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div
            style={{
              background: "white",
              color: "#C2410C",
              padding: 10,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <FaGraduationCap size={22} />
          </div>
          <span
            style={{
              color: "white",
              fontWeight: 800,
              fontSize: "1.3rem",
              letterSpacing: "-0.5px",
              textShadow: "1px 1px 0 rgba(0,0,0,0.2)",
            }}
          >
            SchoolMoney
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close"
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              display: "none",
            }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 16px",
                  borderRadius: 12,
                  color: "white",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                  transition: "all 0.15s ease",
                  backdropFilter: isActive ? "blur(4px)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                <span style={{ fontSize: "1.05rem", opacity: isActive ? 1 : 0.8 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: "0.85rem",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {(user as any)?.avatarUrl ? (
                <img src={(user as any).avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>
                {user?.role === "ROLE_ADMIN" ? "Administrator" : "Rodzic"}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "9px 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
            }}
          >
            <FaSignOutAlt size={14} />
            Wyloguj się
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          marginLeft: 260,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          transition: "margin-left 0.3s ease",
        }}
        className="main-content"
      >
        {/* Top bar (mobile) */}
        <header
          className="mobile-header"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "white",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-primary)",
              padding: 4,
            }}
          >
            <FaBars size={20} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaGraduationCap size={18} style={{ color: "var(--color-primary)" }} />
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>SchoolMoney</span>
          </div>
          <div style={{ width: 28 }} />
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "24px 32px", maxWidth: 1200, width: "100%" }}>
          <Outlet />
        </main>
      </div>

      {/* Responsive CSS injected */}
      <style>{`
        @media (min-width: 769px) {
          .sidebar { left: 0 !important; }
        }
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; }
          .mobile-header { display: flex !important; }
          .mobile-overlay { display: block !important; }
          .sidebar-close { display: block !important; }
          main { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}