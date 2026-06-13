import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";

export default function AdminHome() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/teams").then(setTeams);
    api.get("/users").then(setUsers);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Admin</h1>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <p className="text-3xl font-bold text-navy">{teams.length}</p>
          <p className="text-sm text-navy/60">Teams</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <p className="text-3xl font-bold text-navy">{users.length}</p>
          <p className="text-sm text-navy/60">Users</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <p className="text-3xl font-bold text-navy">{users.filter((u) => u.employmentType === "intern").length}</p>
          <p className="text-sm text-navy/60">Active interns</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <p className="text-3xl font-bold text-navy">{users.filter((u) => u.churnRisk === "high").length}</p>
          <p className="text-sm text-navy/60">High churn risk</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Configuration</h2>
        <ul className="space-y-2 text-sm">
          <li><Link to="/admin/teams" className="text-secondary hover:underline">Manage Teams</Link></li>
          <li><Link to="/admin/users" className="text-secondary hover:underline">Manage Users</Link></li>
          <li><Link to="/admin/metrics" className="text-secondary hover:underline">Manage Metrics</Link></li>
          <li><Link to="/admin/frameworks" className="text-secondary hover:underline">Manage Evaluation Frameworks</Link></li>
          <li><Link to="/admin/internships" className="text-secondary hover:underline">Manage Internships</Link></li>
        </ul>
      </div>
    </div>
  );
}
