import { useState } from "react";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";
import TenantDashboardLayout from "./components/layout/TenantDashboardLayout";
import LoginPage from "./pages/auth/LoginPage";
import AcceptInvitationPage from "./pages/auth/AcceptInvitationPage.jsx";
import PlatformOverview from "./pages/platform/PlatformOverview";
import CompaniesPage from "./pages/platform/CompaniesPage.jsx";
import CompanyDetailsPage from "./pages/platform/CompanyDetailsPage.jsx";
import RegistrationRequestsPage from "./pages/platform/RegistrationRequestsPage.jsx";
import TenantOverview from "./pages/tenant/TenantOverview";
import TenantModulePage from "./pages/tenant/TenantModulePage";
import OrdersPage from "./pages/tenant/orders/OrdersPage";
import VehiclesPage from "./pages/tenant/vehicles/VehiclesPage";
import DriversPage from "./pages/tenant/drivers/DriversPage";

import {
  getTenantNavigation,
  tenantHomePaths,
} from "./config/tenantNavigation";

import { setAuthToken } from "./api/client.js";

import "bootstrap/dist/css/bootstrap.min.css";

import "./App.css";


/* ========================================
   ROLE-BASED HOME ROUTES
   ======================================== */

const homePaths = {
  super_admin: "/platform",
  platform_admin: "/platform",
  tenant_admin: "/tenant",
  fleet_manager: "/fleet",
  driver: "/driver",
};


/* ========================================
   PLATFORM ADMINISTRATION
   ======================================== */

function PlatformWorkspace({ session }) {
  return (
    <DashboardLayout role={session.user.role}>

      <Routes>

        <Route
          index
          element={<PlatformOverview />}
        />

        <Route
          path="companies"
          element={<CompaniesPage />}
        />

        <Route
          path="companies/:companyId"
          element={
            <CompanyDetailsPage
              userRole={session.user.role}
            />
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

    </DashboardLayout>
  );
}


/* ========================================
   TENANT WORKSPACE
   ======================================== */

function TenantWorkspace({ session, onLogout }) {
  const role = session.user.role;

  const basePath = tenantHomePaths[role];

  const navigation = getTenantNavigation(role);

  const moduleRoutes = navigation
    .flatMap((group) => group.items)
    .filter((item) => item.path !== basePath);

  return (
    <TenantDashboardLayout
      session={session}
      onLogout={onLogout}
    >

      <Routes>

        <Route
          index
          element={
            <TenantOverview session={session} />
          }
        />

        {moduleRoutes.map((item) => {
          const relativePath = item.path.slice(
            basePath.length + 1
          );

          let moduleElement;

          switch (relativePath) {
            case "orders":
              moduleElement = <OrdersPage />;
              break;

            case "vehicles":
              moduleElement = <VehiclesPage />;
              break;

            case "drivers":
              moduleElement = <DriversPage />;
              break;

            default:
              moduleElement = (
                <TenantModulePage
                  title={item.label}
                  icon={item.icon}
                  basePath={basePath}
                />
              );
          }

          

          return (
            <Route
              key={item.path}
              path={relativePath}
              element={moduleElement}
            />
          );
        })}

        <Route
          path="*"
          element={<Navigate to={basePath} replace />}
        />

      </Routes>

    </TenantDashboardLayout>
  );
}


/* ========================================
   DRIVER WORKSPACE
   ======================================== */

function DriverWorkspace({ session, onLogout }) {
  return (
    <DashboardLayout role={session.user.role}>

      <div className="vr-page-heading">

        <div>
          <h1>
            Welcome, {session.user.full_name}
          </h1>

          <p>Your VoltRoute driver workspace</p>
        </div>

        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={onLogout}
        >
          Sign Out
        </button>

      </div>

    </DashboardLayout>
  );
}


/* ========================================
   WORKSPACE SELECTION
   ======================================== */

function DashboardHome({ session, onLogout }) {
  const role = session.user.role;

  if (["super_admin", "platform_admin"].includes(role)) {
    return (
      <PlatformWorkspace session={session} />
    );
  }

  if (["tenant_admin", "fleet_manager"].includes(role)) {
    return (
      <TenantWorkspace
        session={session}
        onLogout={onLogout}
      />
    );
  }

  if (role === "driver") {
    return (
      <DriverWorkspace
        session={session}
        onLogout={onLogout}
      />
    );
  }

  return <p>Unsupported account role.</p>;
}


/* ========================================
   MAIN APPLICATION
   ======================================== */

function App() {
  const [session, setSession] = useState(null);

  const location = useLocation();

  const homePath = session
    ? homePaths[session.user.role]
    : null;


  function handleLogin(authenticatedSession) {
    setAuthToken(authenticatedSession.accessToken);
    setSession(authenticatedSession);
  }


  function handleLogout() {
    setAuthToken(null);
    setSession(null);
  }


  /* Public invitation acceptance */

  if (location.pathname === "/accept-invitation") {
    return <AcceptInvitationPage />;
  }


  /* Unauthenticated users */

  if (!session) {
    return (
      <LoginPage onLogin={handleLogin} />
    );
  }


  /* Unsupported account */

  if (!homePath) {
    return <p>Unsupported account role.</p>;
  }


  /* Authenticated application routes */

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
        element={
          <DashboardHome
            session={session}
            onLogout={handleLogout}
          />
        }
      />

      <Route
        path="*"
        element={<Navigate to={homePath} replace />}
      />

    </Routes>
  );
}

export default App;
