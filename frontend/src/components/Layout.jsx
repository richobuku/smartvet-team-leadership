import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const NAV_BY_ROLE = {
  team_member: [
    { to: "/", label: "My Dashboard" },
    { to: "/checkin", label: "Daily Check-In" },
    { to: "/guides", label: "Coaching Hub" },
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
  ],
  executive: [
    { to: "/", label: "Company Overview" },
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
      ],
    },
    { to: "/admin/metrics", label: "Metrics" },
    { to: "/admin/frameworks", label: "Frameworks" },
    { to: "/guides", label: "Coaching Hub" },
  ],
};

const navLinkClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 transition-colors whitespace-nowrap ${
    isActive ? "bg-primary text-white font-semibold" : "text-navy/70 hover:bg-primary/10 hover:text-primary"
  }`;

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
        <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-light py-1 min-w-[170px] z-20">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm transition-colors ${
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

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV_BY_ROLE[user?.role] || [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-light shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={logo} alt="SmartVet" className="h-10 w-10 rounded-full object-cover" />
              <span className="font-display font-extrabold text-lg text-navy whitespace-nowrap">SmartVet Leadership</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-navy/60 whitespace-nowrap">{user?.name} · {user?.role?.replace("_", " ")}</span>
              <button onClick={handleLogout} className="bg-accent/15 text-accent hover:bg-accent/25 rounded-full px-3 py-1.5 font-semibold transition-colors whitespace-nowrap">
                Log out
              </button>
            </div>
          </div>
          <nav className="flex gap-1 text-sm flex-wrap">
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
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
