import { useEffect, useState } from "react";

import {
  Users,
  UserCheck,
  UserX,
  UserRound,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import {
  getAllDrivers,
  getDriverSummary,
  getDriverError,
} from "../../../api/tenantDrivers";

import AnimatedNumber from "../../../components/common/AnimatedNumber";
import GlassModal from "../../../components/common/GlassModal";

import "../vehicles/VehiclesPage.css";
import "./DriversPage.css";

const PAGE_SIZE = 20;

function getInitials(name) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "DR"
  );
}

function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString()
    : "—";
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedDriver, setSelectedDriver] = useState(null);

  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDrivers() {
      setLoading(true);
      setError("");

      try {
        const [driverData, summaryData] =
          await Promise.all([
            getAllDrivers(controller.signal),
            getDriverSummary(controller.signal),
          ]);

        if (!controller.signal.aborted) {
          setDrivers(driverData);
          setSummary(summaryData);
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(getDriverError(requestError));
          setDrivers([]);
          setSummary(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDrivers();

    return () => controller.abort();
  }, [revision]);

  function refresh() {
    setRevision((previous) => previous + 1);
  }

  const metrics = [
    {
      label: "Total Drivers",
      value: summary?.total_drivers,
      icon: Users,
      color: "blue",
    },
    {
      label: "Active Drivers",
      value: summary?.active_drivers,
      icon: UserCheck,
      color: "green",
    },
    {
      label: "Inactive Drivers",
      value: summary?.inactive_drivers,
      icon: UserX,
      color: "orange",
    },
  ];

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch = [
      driver.full_name,
      driver.email,
      driver.id,
    ].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(normalizedSearch)
    );

    const matchesStatus =
      statusFilter === "" ||
      (statusFilter === "active" && driver.is_active) ||
      (statusFilter === "inactive" && !driver.is_active);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDrivers.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages - 1);

  const visibleDrivers = filteredDrivers.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  return (
    <div className="vveh-page vdrv-page">

      {/* Page heading */}

      <div className="vveh-heading">
        <div>
          <span className="vveh-eyebrow">
            Fleet Management
          </span>

          <h1>Drivers</h1>

          <p>
            Manage and monitor your organization's
            electric fleet operators.
          </p>
        </div>

        <button
          type="button"
          className="vveh-secondary-button"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw
            size={18}
            className={loading ? "vveh-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error notification */}

      {error && (
        <div className="vveh-error" role="alert">
          {error}
        </div>
      )}

      {/* Animated statistics */}

      <div className="vveh-metrics vdrv-metrics">

        {metrics.map((metric) => {
          const MetricIcon = metric.icon;

          return (
            <article
              className="vveh-metric"
              key={metric.label}
            >
              <div>
                <span>{metric.label}</span>

                <strong>
                  <AnimatedNumber
                    value={
                      loading || error
                        ? null
                        : metric.value
                    }
                    duration={1400}
                  />
                </strong>
              </div>

              <div
                className={
                  `vveh-metric-icon vveh-${metric.color}`
                }
              >
                <MetricIcon size={24} />
              </div>
            </article>
          );
        })}

      </div>

      {/* Driver directory */}

      <section className="vveh-panel">

        <div className="vveh-panel-header">
          <div>
            <h2>Driver Directory</h2>

            <p>
              View your company's registered drivers.
            </p>
          </div>
        </div>

        {/* Search and filters */}

        <div className="vveh-toolbar">

          <div className="vveh-search">
            <Search size={19} />

            <input
              value={search}
              placeholder="Search name, email or driver ID..."
              aria-label="Search drivers"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
            />
          </div>

          <select
            value={statusFilter}
            aria-label="Filter driver status"
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(0);
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            className="vveh-secondary-button"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setPage(0);
            }}
          >
            Clear
          </button>

        </div>

        {/* Loading and empty states */}

        {loading ? (
          <div className="vveh-empty">

            <RefreshCw
              size={32}
              className="vveh-spinning"
            />

            <h3>Loading drivers...</h3>

          </div>

        ) : error ? (
          <div className="vveh-empty">

            <Users size={42} />

            <h3>Unable to load drivers</h3>

            <button
              type="button"
              className="vveh-secondary-button"
              onClick={refresh}
            >
              Try Again
            </button>

          </div>

        ) : visibleDrivers.length === 0 ? (
          <div className="vveh-empty">

            <Users size={44} />

            <h3>No drivers found</h3>

            <p>
              {drivers.length === 0
                ? "No driver accounts have been registered."
                : "Try changing your search or filters."}
            </p>

          </div>

        ) : (

          <div className="vveh-table-wrapper">

            <table className="vveh-table vdrv-table">

              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Driver ID</th>
                  <th>Email Address</th>
                  <th>Registered</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {visibleDrivers.map((driver) => (
                  <tr key={driver.id}>

                    <td>
                      <button
                        type="button"
                        className="vdrv-identity"
                        onClick={() =>
                          setSelectedDriver(driver)
                        }
                      >

                        <div className="vdrv-avatar">
                          {getInitials(driver.full_name)}
                        </div>

                        <div>
                          <strong>
                            {driver.full_name}
                          </strong>

                          <small>Fleet Operator</small>
                        </div>

                      </button>
                    </td>

                    <td>#{driver.id}</td>

                    <td>{driver.email}</td>

                    <td>
                      {formatDate(driver.created_at)}
                    </td>

                    <td>
                      <span
                        className={
                          driver.is_active
                            ? "vveh-badge vveh-green"
                            : "vveh-badge vveh-neutral"
                        }
                      >
                        {driver.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="vveh-icon-button"
                        title="View driver profile"
                        aria-label={`View ${driver.full_name}`}
                        onClick={() =>
                          setSelectedDriver(driver)
                        }
                      >
                        <ChevronRight size={20} />
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>

          </div>
        )}

        {/* Pagination */}

        <div className="vveh-pagination">

          <span>
            Page {currentPage + 1} of {totalPages}
            {" · "}
            {filteredDrivers.length} drivers
          </span>

          <div className="vveh-button-group">

            <button
              type="button"
              className="vveh-secondary-button"
              disabled={loading || currentPage === 0}
              onClick={() =>
                setPage(currentPage - 1)
              }
            >
              <ChevronLeft size={17} />
              Previous
            </button>

            <button
              type="button"
              className="vveh-secondary-button"
              disabled={
                loading ||
                currentPage >= totalPages - 1
              }
              onClick={() =>
                setPage(currentPage + 1)
              }
            >
              Next
              <ChevronRight size={17} />
            </button>

          </div>
        </div>

      </section>

      {/* Glass driver profile modal */}

      {selectedDriver && (
        <GlassModal
          title="Driver Profile"
          subtitle="Fleet operator information"
          size="md"
          onClose={() => setSelectedDriver(null)}
        >

          <div className="vdrv-profile">

            <div className="vdrv-profile-heading">

              <div className="vdrv-avatar vdrv-avatar-large">
                {getInitials(selectedDriver.full_name)}
              </div>

              <div>
                <h2>{selectedDriver.full_name}</h2>

                <p>{selectedDriver.email}</p>

                <span
                  className={
                    selectedDriver.is_active
                      ? "vveh-badge vveh-green"
                      : "vveh-badge vveh-neutral"
                  }
                >
                  {selectedDriver.is_active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

            </div>

            <h3 className="vdrv-section-title">
              <UserRound size={19} />
              Account Information
            </h3>

            <dl className="vveh-details-grid">

              {[
                ["Full Name", selectedDriver.full_name],
                ["Driver ID", selectedDriver.id],
                ["Email Address", selectedDriver.email],
                ["Role", "Fleet Operator"],
                [
                  "Account Status",
                  selectedDriver.is_active
                    ? "Active"
                    : "Inactive",
                ],
                [
                  "Registered",
                  formatDate(selectedDriver.created_at),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}

            </dl>

          </div>

        </GlassModal>
      )}

    </div>
  );
}