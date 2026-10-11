import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Search, User, Menu, X, Phone, MapPin } from "lucide-react";
import { FaGuitar, FaStore } from "react-icons/fa";
import "../Styles/header_component.css";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/products", label: "Shop", end: false },
  { to: "/about", label: "About", end: false },
  { to: "/contact", label: "Contact", end: false },
];

export function HeaderHomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  // shrink the header once the user scrolls past the top
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`hdr${scrolled ? " is-scrolled" : ""}`}>
        <div className="hdr-inner">
          {/* ---------- brand: big/wide logo only ---------- */}
          <NavLink to="/" className="hdr-brand" aria-label="Guitar Cart home">
            <img
              src="/ChatGPT Image Oct 11, 2026, 05_26_38 PM.png"
              alt="Guitar Cart logo"
              draggable={false}
              onError={(e) => {
                // hide gracefully if the image is ever missing
                e.currentTarget.style.display = "none";
              }}
            />
          </NavLink>

          {/* ---------- search (sits to the left, right after the logo) ---------- */}
          <form
            className="hdr-search"
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <Search className="hdr-search-icon" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guitars, keyboards, harmonicas…"
              aria-label="Search products"
            />
          </form>

          {/* ---------- desktop nav (buttons centered) ---------- */}
          <nav className="hdr-nav" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `hdr-link${isActive ? " is-active" : ""}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* ---------- actions (right) ---------- */}
          <div className="hdr-actions">
            <NavLink to="/login" className="hdr-login" aria-label="Login">
              <User size={18} />
              <span>Login</span>
            </NavLink>

            {/* hamburger — mobile only */}
            <button
              type="button"
              className="hdr-iconbtn hdr-burger"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ---------- mobile slide-down menu ---------- */}
      <div className={`hdr-mobile${menuOpen ? " is-open" : ""}`}>
        <div>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `hdr-mobile-link${isActive ? " is-active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.to === "/" ? (
                <FaStore size={17} />
              ) : link.label === "Shop" ? (
                <FaGuitar size={17} />
              ) : (
                <span style={{ width: 17 }} />
              )}
              {link.label}
            </NavLink>
          ))}

          <a className="hdr-mobile-link" href="tel:+911234567890">
            <Phone size={17} />
            +91 12345 67890
          </a>
          <a className="hdr-mobile-link" href="/contact">
            <MapPin size={17} />
            Find a store near you
          </a>
        </div>
      </div>
    </>
  );
}

export default HeaderHomePage;
