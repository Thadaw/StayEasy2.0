import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguagePicker } from "./LanguagePicker";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import logo1 from "../assets/logo1.png";

export function Navbar({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { firstName, lastName, displayInitials, photoUrl } = useUserProfile();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const displayName = firstName || user?.email?.split("@")[0] || "";
  const userEmail = user?.email || "";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-white/30 backdrop-blur-lg border-b border-transparent"
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 h-[56px] sm:h-[60px] md:h-[68px] flex items-center gap-2 md:gap-4">

        <Link to="/" className="shrink-0 flex items-center gap-1.5 md:gap-2 group">
          <img src={logo1} alt="StayEasy" className="h-[30px] sm:h-[34px] w-auto transition-transform duration-300 group-hover:scale-105" />
          <span
            style={{
              fontFamily: "'Sora', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(18px, 3vw, 26px)",
              letterSpacing: "-0.5px",
              lineHeight: 1,
              color: "var(--brand-primary)",
            }}
          >
            Stay<span style={{ color: "var(--brand-accent)" }}>Easy</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {!compact && (
            <div className="ml-2">
              <LanguagePicker />
            </div>
          )}

          {!compact && (
            <Link
              to="/host/login"
              className="hidden lg:block px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95 whitespace-nowrap"
              style={{ color: scrolled ? "var(--foreground)" : "var(--brand-dark)" }}
            >
              {t("becomeAHost")}
            </Link>
          )}

          <div ref={menuRef} className="relative">
            <button
              onClick={() => { if (user) { navigate('/profile'); } else { setMenuOpen(v => !v); } }}
              className="flex items-center gap-1.5 sm:gap-2 border rounded-full px-2 sm:px-3 py-1.5 sm:py-2 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
              style={{
                borderColor: scrolled ? "var(--border)" : "rgba(255,255,255,0.3)",
                backgroundColor: scrolled ? "white" : "rgba(255,255,255,0.15)",
                backdropFilter: scrolled ? "none" : "blur(4px)",
              }}
            >
              {user ? (
                <>
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white" style={{ backgroundColor: 'var(--brand-accent)' }}>
                      {displayInitials}
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-semibold max-w-[100px] truncate" style={{ color: "var(--brand-dark)" }}>
                    {displayName}
                  </span>
                  <ChevronDown size={12} className={`transition-transform hidden sm:block ${menuOpen ? "rotate-180" : ""}`} style={{ color: scrolled ? "var(--muted-foreground)" : "rgba(255,255,255,0.7)" }} />
                </>
              ) : (
                <>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: scrolled ? "var(--muted)" : "rgba(255,255,255,0.2)" }}>
                    <User size={14} style={{ color: "var(--muted-foreground)" }} />
                  </div>
                  <span className="hidden sm:block text-sm font-medium" style={{ color: "var(--foreground)" }}>{t("account")}</span>
                  <ChevronDown size={12} className={`transition-transform hidden sm:block ${menuOpen ? "rotate-180" : ""}`} style={{ color: scrolled ? "var(--muted-foreground)" : "rgba(255,255,255,0.7)" }} />
                </>
              )}
            </button>

            {menuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 sm:w-60 bg-white rounded-xl shadow-2xl border overflow-hidden z-50" style={{ borderColor: "var(--border)" }}>
                {user ? (
                  <>
                    <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--accent)" }}>
                      <div className="flex items-center gap-3">
                        {photoUrl ? (
                          <img src={photoUrl} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2" style={{ borderColor: "var(--primary)" }} />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold text-white border-2" style={{ backgroundColor: 'var(--brand-accent)', borderColor: "var(--primary)" }}>
                            {displayInitials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold truncate text-sm sm:text-base" style={{ color: "var(--brand-dark)" }}>
                            {displayName}{lastName ? ` ${lastName}` : ""}
                          </p>
                          <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{userEmail}</p>
                          {user.countryFlag && user.country && (
                            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--primary)" }}>
                              <span>{user.countryFlag}</span><span>{user.country}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { navigate("/profile"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent" style={{ color: "var(--foreground)" }}>
                        <User size={15} style={{ color: "var(--primary)" }} />{t("profile")}
                      </button>
                      <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />
                      <button onClick={() => { logout(); navigate("/"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent" style={{ color: "var(--foreground)" }}>
                        <LogOut size={15} style={{ color: "var(--muted-foreground)" }} />{t("logout")}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-1">
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="flex px-4 py-3 text-sm font-bold transition-colors hover:bg-accent" style={{ color: "var(--brand-dark)" }}>{t("login")}</Link>
                    <Link to="/signup" onClick={() => setMenuOpen(false)} className="flex px-4 py-2.5 text-sm transition-colors hover:bg-accent" style={{ color: "var(--foreground)" }}>{t("signUp")}</Link>
                    <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />
                    <Link to="/host/login" onClick={() => setMenuOpen(false)} className="flex px-4 py-2.5 text-sm transition-colors hover:bg-accent" style={{ color: "var(--foreground)" }}>{t("becomeAHost")}</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
