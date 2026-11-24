import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./pages/auth/LoginPage";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { setAuthToken } from "./api/client.js";
import PlatformOverview from "./pages/platform/PlatformOverview";
import CompaniesPage from "./pages/platform/CompaniesPage.jsx";
import CompanyDetailsPage from "./pages/platform/CompanyDetailsPage.jsx";
import AcceptInvitationPage from "./pages/auth/AcceptInvitationPage.jsx";
import RegistrationRequestsPage from "./pages/platform/RegistrationRequestsPage.jsx";

const homePaths = {
  super_admin: "/platform",
  platform_admin: "/platform",
  tenant_admin: "/tenant",
  fleet_manager: "/fleet",
  driver: "/driver",
};


function DashboardHome({ session, onLogout }) {
  const isPlatformAdmin = ["super_admin", "platform_admin"].includes(
    session.user.role
  );

  return (
    <DashboardLayout role={session.user.role}>
      {isPlatformAdmin ? (
        <Routes>
          <Route index element={<PlatformOverview />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route
            path="companies/:companyId"
            element={
              <CompanyDetailsPage userRole={session.user.role} />
            }
          />
          <Route
            path="registrations"
            element={<RegistrationRequestsPage />}
          />
          <Route
            path="*"
            element={<Navigate to="/platform" replace />}
          />
        </Routes>
      ) : (
        <>
          <div className="vr-page-heading">
            <div>
              <h1>Welcome, {session.user.full_name}</h1>
              <p>Your VoltRoute workspace</p>
            </div>

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={onLogout}
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}


function App(){
  const [session, setSession] = useState(null);
  const location = useLocation();
  const homePath = session ? homePaths[session.user.role] : null;

  function handleLogin(authenticatedSession){
    setAuthToken(authenticatedSession.accessToken);
    setSession(authenticatedSession);
  }
  function handleLogout() {
    setAuthToken(null);
    setSession(null);
  }

  if (location.pathname === "/accept-invitation") {
    return <AcceptInvitationPage />;
  }

  if (!session){
    return <LoginPage onLogin={handleLogin}/>;
  }

  if (!homePath){
    return <p>Unsupported account role.</p>;  
  }

  return (
    <Routes>
          <Route
            path="/"
            element={<Navigate to={homePath} replace />}
          />
          <Route
            path="/login"
            element={<Navigate to={homePath} replace />}
          />
          <Route
            path={`${homePath}/*`}
            element={<DashboardHome session={session} onLogout={handleLogout} />}
          />
          <Route
            path="*"
            element={<Navigate to={homePath} replace />}
          />
              
        </Routes>
  );
}

export default App;