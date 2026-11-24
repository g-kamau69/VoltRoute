
import {
  Building2,
  Bike,
  Users,
  BatteryCharging,
  ClipboardList,
  AlertTriangle,
  Activity,
  ArrowUpRight,
} from "lucide-react";

const summaryCards = [
  {
    title: "Registered Companies",
    icon: Building2,
    color: "green",
  },
  {
    title: "Total Vehicles",
    icon: Bike,
    color: "blue",
  },
  {
    title: "Platform Users",
    icon: Users,
    color: "purple",
  },
  {
    title: "Swap Stations",
    icon: BatteryCharging,
    color: "orange",
  },
  {
    title: "Pending Registrations",
    icon: ClipboardList,
    color: "blue",
  },
  {
    title: "Active Alerts",
    icon: AlertTriangle,
    color: "red",
  },
];
import { useEffect, useState } from "react";
import api from "../../api/client.js";
import {
  getPlatformTenants,
  getTenantRegistrationRequests,
  getPlatformDashboardStats
} from "../../api/platform.js";

export default function PlatformOverview() {
    const [apiStatus, setApiStatus] = useState("Checking...");
    const [dashboardStats, setDashboardStats] = useState(null);
    const [statsError, setStatsError] = useState("");
    const [companyStats, setCompanyStats] = useState({
        companies: null,
        pendingRegistrations: null,
        loading: true,
        error: "",
        });
    
    useEffect(() => {
        let cancelled = false;

        async function checkHealth() {
            try {
                const response = await api.get("/health");

                if (!cancelled) {
                    setApiStatus(
                        response.data.status === "healthy"
                            ? "Healthy"
                            : "Unknown"
                    );
                }
            } catch {
                if (!cancelled) {
                    setApiStatus("Disconnected");
                }
            }
        }

        checkHealth();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function fetchAllPages(fetchPage, statusFilter = null) {
            const results = [];
            const limit = 100;
            let offset = 0;

            while (true) {
                const page = await fetchPage({
                    limit,
                    offset,
                    statusFilter,
                });

                if (!Array.isArray(page)) {
                    throw new Error("Unexpected API response");
                }

                results.push(...page);

                if (page.length < limit) {
                    break;
                }

                offset += page.length;

            }

            return results;
    }

    async function loadCompanyStats() {
        try{
            const [companies, pendingRequests] = await Promise.all([
                fetchAllPages(getPlatformTenants),
                fetchAllPages(getTenantRegistrationRequests, "pending"),
            ]);

            if (!cancelled) {
                setCompanyStats({
                    companies: companies.length,
                    pendingRegistrations: pendingRequests.length,
                    loading: false,
                    error: "",
                });
            }
        } catch (error) {
            if (!cancelled) {
                setCompanyStats({
                    companies: null,
                    pendingRegistrations: null,
                    loading: false,
                    error: "Unable to load organization statistics",
                });
            }
        }
    }
    loadCompanyStats();

    return () => {
        cancelled = true;
    };
}, []);

    useEffect(() => {
        let cancelled = false;

        async function loadDashboardStats() {
            try {
                const data = await getPlatformDashboardStats();

                if (!cancelled) {
                    setDashboardStats(data);
                    setStatsError("");
                }
            } catch {
                if (!cancelled) {
                    setStatsError("Unable to load platform statistics");
                }
            }
        }
        

        loadDashboardStats();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
    <div className="platform-overview">
      <div className="vr-page-heading">
        <div>
          <h1>Platform Overview</h1>
          <p>
            Monitor organizations, fleet activity, and
            platform operations.
          </p>
        </div>

        <span className="badge text-bg-light border">
          Platform Administration
        </span>
      </div>

      <div className="row g-4 mt-2">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const values = {
            "Registered Companies": companyStats.companies,
            "Total Vehicles": dashboardStats?.total_vehicles,
            "Platform Users": dashboardStats?.total_users,
            "Swap Stations": dashboardStats?.total_swap_stations,
            "Pending Registrations": companyStats.pendingRegistrations,
            "Active Alerts": dashboardStats?.active_alerts,
          };

          const value = values[card.title];

          const isCompanyCard = [
            "Registered Companies",
            "Pending Registrations",
          ].includes(card.title);

            const isLoading = isCompanyCard
              ? companyStats.loading
              : !dashboardStats && !statsError;

            const error = isCompanyCard
              ? companyStats.error
              : statsError;

            const isConnectedCard =
                card.title === "Registered Companies" ||    
                card.title === "Pending Registrations";
          return (
            <div
              key={card.title}
              className="col-12 col-sm-6 col-xl-4"
            >
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="text-secondary mb-2">
                        {card.title}
                      </p>

                      <h2 className="h2 fw-bold mb-0">
                        {isConnectedCard && companyStats.loading
                            ? "..."
                            : value ?? "—"}
                      </h2>
                    </div>

                    <div className={`vr-stat-icon vr-stat-${card.color}`}>
                      <Icon size={22} />
                    </div>
                  </div>

                  <p className="text-secondary small mt-3 mb-0">
                    {error
                        ? error
                        : isLoading
                        ? "Loading..."
                        : value === null || value === undefined
                            ? "Not implemented"
                            : "Live data"}
                    </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="row g-4 mt-2">
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-semibold mb-0">
                  Recent Platform Activity
                </h5>
                <ArrowUpRight size={18} />
              </div>

              <div className="vr-empty-state">
                <Activity size={32} />
                <p className="mt-3 mb-1">
                  No activity loaded yet
                </p>
                <small>
                  Registration approvals and platform
                  events will appear here.
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h5 className="fw-semibold mb-4">
                System Status
              </h5>

                    
        <div className="vr-system-row">
        <span>Backend API</span>
        <span
            className={
            apiStatus === "Healthy"
                ? "text-success fw-semibold"
                : apiStatus === "Disconnected"
                ? "text-danger fw-semibold"
                : "text-secondary"
            }
        >
            {apiStatus}
        </span>
        </div>


              <div className="vr-system-row">
                <span>Database</span>
                <span className="text-secondary">
                  Not checked
                </span>
              </div>

              <div className="vr-system-row">
                <span>Telemetry Simulator</span>
                <span className="text-secondary">
                  Not connected
                </span>
              </div>

              <div className="vr-system-row">
                <span>Routing Engine</span>
                <span className="text-secondary">
                  Not checked
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
