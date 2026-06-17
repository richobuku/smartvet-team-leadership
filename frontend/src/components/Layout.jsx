import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import NotificationBell from "./NotificationBell";

const NAV_BY_ROLE = {
  team_member: [
    { to: "/", label: "My Dashboard" },
    { to: "/checkin", label: "Daily Check-In" },
    { to: "/guides", label: "Coaching Hub" },
    { to: "/panels", label: "Interview Panels" },
    { to: "/binders", label: "Candidate Reviews" },
  ],
  team_leader: [
    { to: "/", label: "My Team" },
    {
      label: "Reviews",
      items: [
        { to: "/leader/review", label: "Weekly Review" },
        { to: "/leader/scorecards", label: "Monthly Scorecards" },
        { to: "/leader/internships", label: "Internship Review" },
        { to: "/leader/oneonones", label: "1-on-1s" },
      ],
    },
    {
      label: "Coaching",
      items: [
        { to: "/leader/coaching", label: "Coaching Log" },
        { to: "/leader/feedback", label: "Feedback" },
        { to: "/leader/growth-plans", label: "Growth Plans" },
        { to: "/guides", label: "Coaching Hub" },
      ],
    },
    { to: "/leader/celebrations", label: "Celebrations" },
    { to: "/panels", label: "Interview Panels" },
    { to: "/binders", label: "Candidate Reviews" },
  ],
  executive: [
    { to: "/", label: "Company Overview" },
    { to: "/hr/recruitment", label: "Recruitment" },
    { to: "/panels", label: "Interview Panels" },
    { to: "/binders", label: "Candidate Reviews" },
    { to: "/guides", label: "Coaching Hub" },
  ],
  admin: [
    { to: "/", label: "Admin" },
    {
      label: "Manage",
      items: [
        { to: "/admin/teams", label: "Teams" },
        { to: "/admin/users", label: "Users" },
        { to: "/admin/internships", label: "Internships" },
        { to: "/hr/recruitment", label: "Recruitment" },
      ],
    },
    { to: "/admin/metrics", label: "Metrics" },
    { to: "/admin/frameworks", label: "Frameworks" },
    { to: "/panels", label: "Interview Panels" },
    { to: "/binders", label: "Candidate Reviews" },
    { to: "/guides", label: "Coaching Hub" },
  ],
  hr_manager: [
    { to: "/", label: "Recruitment" },
    { to: "/panels", label: "Interview Panels" },
    { to: "/binders", label: "Candidate Reviews" },
    { to: "/guides", label: "Coaching Hub" },
  ],
};

const navLinkClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 transition-colors whitespace-nowrap ${
    isActive ? "bg-primary text-white font-semibold" : "text-navy/70 hover:bg-primary/10 hover:text-primary"
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 transition-colors ${
    isActive ? "bg-primary text-white font-semibold" : "text-navy/70 hover:bg-primary/10 hover:text-primary"
  }`;

// Desktop dropdown: floats below the trigger with a viewport-safe max width.
function NavDropdown({ label, items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const isActive = items.some((item) => location.pathname === item.to);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`rounded-full px-3 py-1.5 transition-colors whitespace-nowrap flex items-center gap-1 ${
          isActive ? "bg-primary text-white font-semibold" : "text-navy/70 hover:bg-primary/10 hover:text-primary"
        }`}
      >
        {label}
        <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-light py-1 min-w-[170px] max-w-[calc(100vw-2rem)] z-20">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm transition-colors whitespace-nowrap ${
                  isActive ? "bg-primary/10 text-primary font-semibold" : "text-navy/70 hover:bg-light"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

// Mobile dropdown: an inline accordion section (no absolute positioning) so it
// stacks naturally inside the slide-down mobile nav panel.
function MobileNavDropdown({ label, items, onNavigate }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isActive = items.some((item) => location.pathname === item.to);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
          isActive ? "bg-primary/10 text-primary font-semibold" : "text-navy/70 hover:bg-primary/10 hover:text-primary"
        }`}
      >
        {label}
        <span className="text-xs">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="mt-1 ml-3 flex flex-col gap-1 border-l border-light pl-3">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={onNavigate} className={mobileNavLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = NAV_BY_ROLE[user?.role] || [];
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-light shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={logo} alt="SmartVet" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover shrink-0" />
              <span className="font-display font-extrabold text-base sm:text-lg text-navy whitespace-nowrap truncate">
                SmartVet Leadership
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-sm">
              <NotificationBell />
              <span className="hidden sm:inline text-navy/60 whitespace-nowrap">
                {user?.name} · {user?.role?.replace("_", " ")}
              </span>
              <button
                onClick={handleLogout}
                className="bg-accent/15 text-accent hover:bg-accent/25 rounded-full px-3 py-1.5 font-semibold transition-colors whitespace-nowrap"
              >
                Log out
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle navigation menu"
                className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-navy/70 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {menuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <span className="sm:hidden text-xs text-navy/60 -mt-1">
            {user?.name} · {user?.role?.replace("_", " ")}
          </span>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1 text-sm flex-wrap">
            {links.map((link) =>
              link.items ? (
                <NavDropdown key={link.label} label={link.label} items={link.items} />
              ) : (
                <NavLink key={link.to} to={link.to} end={link.to === "/"} className={navLinkClass}>
                  {link.label}
                </NavLink>
              )
            )}
          </nav>

          {/* Mobile nav */}
          {menuOpen && (
            <nav className="md:hidden flex flex-col gap-1 text-sm pb-2">
              {links.map((link) =>
                link.items ? (
                  <MobileNavDropdown key={link.label} label={link.label} items={link.items} onNavigate={() => setMenuOpen(false)} />
                ) : (
                  <NavLink key={link.to} to={link.to} end={link.to === "/"} className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </NavLink>
                )
              )}
            </nav>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
