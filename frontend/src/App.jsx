import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";

import PersonalDashboard from "./pages/member/PersonalDashboard";
import CheckIn from "./pages/member/CheckIn";

import TeamDashboard from "./pages/leader/TeamDashboard";
import WeeklyReview from "./pages/leader/WeeklyReview";
import CoachingLog from "./pages/leader/CoachingLog";
import Celebrations from "./pages/leader/Celebrations";
import MonthlyScorecard from "./pages/leader/MonthlyScorecard";
import LeaderInternships from "./pages/leader/Internships";
import OneOnOnes from "./pages/leader/OneOnOnes";
import Feedback from "./pages/leader/Feedback";
import GrowthPlans from "./pages/leader/GrowthPlans";
import Guides from "./pages/Guides";

import ExecutiveDashboard from "./pages/executive/ExecutiveDashboard";

import AdminHome from "./pages/admin/AdminHome";
import AdminTeams from "./pages/admin/Teams";
import AdminUsers from "./pages/admin/Users";
import AdminMetrics from "./pages/admin/Metrics";
import AdminFrameworks from "./pages/admin/Frameworks";
import AdminInternships from "./pages/admin/Internships";
import InternshipProfile from "./pages/InternshipProfile";

import Recruitment from "./pages/hr/Recruitment";
import ApplicantProfile from "./pages/hr/ApplicantProfile";
import MyPanels from "./pages/panels/MyPanels";
import PanelReview from "./pages/panels/PanelReview";
import MyBinders from "./pages/binders/MyBinders";
import BinderReview from "./pages/binders/BinderReview";

function HomeForRole() {
  const { user } = useAuth();
  switch (user.role) {
    case "team_leader":
      return <TeamDashboard />;
    case "executive":
      return <ExecutiveDashboard />;
    case "admin":
      return <AdminHome />;
    case "hr_manager":
      return <Recruitment />;
    default:
      return <PersonalDashboard />;
  }
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-6 text-navy/60">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<HomeForRole />} />

            <Route path="/checkin" element={<RequireRole roles={["team_member"]}><CheckIn /></RequireRole>} />

            <Route path="/leader/review" element={<RequireRole roles={["team_leader"]}><WeeklyReview /></RequireRole>} />
            <Route path="/leader/coaching" element={<RequireRole roles={["team_leader"]}><CoachingLog /></RequireRole>} />
            <Route path="/leader/celebrations" element={<RequireRole roles={["team_leader"]}><Celebrations /></RequireRole>} />
            <Route path="/leader/scorecards" element={<RequireRole roles={["team_leader"]}><MonthlyScorecard /></RequireRole>} />
            <Route path="/leader/internships" element={<RequireRole roles={["team_leader"]}><LeaderInternships /></RequireRole>} />
            <Route path="/internships/:id" element={<RequireRole roles={["team_leader", "admin", "executive", "team_member"]}><InternshipProfile /></RequireRole>} />
            <Route path="/leader/oneonones" element={<RequireRole roles={["team_leader"]}><OneOnOnes /></RequireRole>} />
            <Route path="/leader/feedback" element={<RequireRole roles={["team_leader"]}><Feedback /></RequireRole>} />
            <Route path="/leader/growth-plans" element={<RequireRole roles={["team_leader"]}><GrowthPlans /></RequireRole>} />

            <Route path="/guides" element={<Guides />} />

            <Route path="/admin/teams" element={<RequireRole roles={["admin"]}><AdminTeams /></RequireRole>} />
            <Route path="/admin/users" element={<RequireRole roles={["admin"]}><AdminUsers /></RequireRole>} />
            <Route path="/admin/metrics" element={<RequireRole roles={["admin"]}><AdminMetrics /></RequireRole>} />
            <Route path="/admin/frameworks" element={<RequireRole roles={["admin"]}><AdminFrameworks /></RequireRole>} />
            <Route path="/admin/internships" element={<RequireRole roles={["admin"]}><AdminInternships /></RequireRole>} />

            <Route path="/hr/recruitment" element={<RequireRole roles={["admin", "hr_manager", "executive"]}><Recruitment /></RequireRole>} />
            <Route path="/hr/recruitment/:id" element={<RequireRole roles={["admin", "hr_manager", "executive"]}><ApplicantProfile /></RequireRole>} />

            <Route path="/panels" element={<MyPanels />} />
            <Route path="/panels/:id" element={<PanelReview />} />

            <Route path="/binders" element={<MyBinders />} />
            <Route path="/binders/:id" element={<BinderReview />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
