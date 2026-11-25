import { useEffect, useState } from "react";

import {
  Bike,
  Plus,
  Upload,
  Search,
  RefreshCw,
  CheckCircle2,
  Wrench,
  Archive,
  FileText,
  Eye,
  Pencil,
  Play,
  ChevronLeft,
  ChevronRight,
  X,
  UserRound,
} from "lucide-react";
import GlassModal from "../../../components/common/GlassModal";
import AnimatedNumber from "../../../components/common/AnimatedNumber";

import {
  getAllVehicles,
  getVehicleAssignments,
  activateVehicle,
  enterVehicleMaintenance,
  returnVehicleToService,
  archiveVehicle,
  getVehicleError,
} from "../../../api/tenantVehicles";

import {
  vehicleStatuses,
  getVehicleStatus,
  getVehiclePermissions,
  getVehicleStatistics,
} from "../../../config/vehicleLifecycle";

import BatteryIndicator from "../../../components/common/BatteryIndicator";

import VehicleForm from "./VehicleForm";
import VehicleDetails from "./VehicleDetails";
import VehicleImport from "./VehicleImport";

import "./VehiclesPage.css";

const PAGE_SIZE = 20;

const vehicleTypes = [
  "electric_motorcycle",
  "electric_scooter",
  "electric_tuk_tuk",
  "electric_van",
];

function formatLabel(value) {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [assignmentError, setAssignmentError] =
    useState(false);

  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);

  const [panel, setPanel] = useState(null);

  const [selectedVehicleId, setSelectedVehicleId] =
    useState(null);

  const [busyVehicleId, setBusyVehicleId] =
    useState(null);

  /* Load tenant fleet and assignments */

  useEffect(() => {
    const controller = new AbortController();

    async function loadFleet() {
      setLoading(true);
      setLoadError("");

      const [vehicleResult, assignmentResult] =
        await Promise.allSettled([
          getAllVehicles(controller.signal),
          getVehicleAssignments(controller.signal),
        ]);

      if (controller.signal.aborted) return;

      if (vehicleResult.status === "fulfilled") {
        setVehicles(vehicleResult.value);
      } else {
        setVehicles([]);

        setLoadError(
          getVehicleError(vehicleResult.reason)
        );
      }

      if (assignmentResult.status === "fulfilled") {
        setAssignments(assignmentResult.value);
        setAssignmentError(false);
      } else {
        setAssignments([]);
        setAssignmentError(true);
      }

      setLoading(false);
    }

    loadFleet();

    return () => controller.abort();

  }, [revision]);

  function refresh() {
    setRevision((previous) => previous + 1);
  }

  function closePanel() {
    setPanel(null);
    setSelectedVehicleId(null);
  }

  function handleSaved(message) {
    closePanel();

    setError("");
    setSuccess(message);

    setPage(0);
    refresh();
  }

  function openPanel(type, vehicle = null) {
    setError("");
    setSuccess("");

    setSelectedVehicleId(vehicle?.id ?? null);
    setPanel(type);
  }

  /* Vehicle lifecycle operations */

  async function handleLifecycle(vehicle, action) {
    if (busyVehicleId !== null || loading) return;

    const actionConfig = {
      activate: {
        execute: activateVehicle,
        label: "Activate",
        success: "activated",
      },

      maintenance: {
        execute: enterVehicleMaintenance,
        label: "Move to maintenance:",
        success: "moved to maintenance",
      },

      return: {
        execute: returnVehicleToService,
        label: "Return to service:",
        success: "returned to service",
      },

      archive: {
        execute: archiveVehicle,
        label: "Archive",
        success: "archived",
      },
    };

    const config = actionConfig[action];

    if (!config) return;

    const hasAssignment = assignments.some(
      (item) => item.vehicle_id === vehicle.id
    );

    if (
      ["maintenance", "archive"].includes(action) &&
      (hasAssignment || assignmentError)
    ) {
      setError(
        assignmentError
          ? "Unable to verify driver assignments. Refresh before changing vehicle status."
          : "Release the current driver assignment before taking this vehicle out of service."
      );

      return;
    }

    const confirmed = window.confirm(
      `${config.label} ${vehicle.fleet_id}?`
    );

    if (!confirmed) return;

    setBusyVehicleId(vehicle.id);
    setError("");
    setSuccess("");

    try {
      const updatedVehicle =
        await config.execute(vehicle.id);

      setVehicles((previous) =>
        previous.map((item) =>
          item.id === updatedVehicle.id
            ? updatedVehicle
            : item
        )
      );

      setSuccess(
        `${vehicle.fleet_id} ${config.success} successfully.`
      );

      refresh();

    } catch (requestError) {
      setError(getVehicleError(requestError));

    } finally {
      setBusyVehicleId(null);
    }
  }

  /* Search and filter fleet inventory */

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = [
      vehicle.fleet_id,
      vehicle.registration_number,
      vehicle.manufacturer,
      vehicle.model,
      vehicle.vin,
    ].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(normalizedSearch)
    );

    const matchesStatus =
      !statusFilter ||
      vehicle.status === statusFilter;

    const matchesType =
      !typeFilter ||
      vehicle.vehicle_type === typeFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredVehicles.length / PAGE_SIZE)
  );

  const currentPage = Math.min(
    page,
    totalPages - 1
  );

  const visibleVehicles = filteredVehicles.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.id === selectedVehicleId
  );

  const selectedAssignment = assignments.find(
    (item) => item.vehicle_id === selectedVehicleId
  );

  const statistics = getVehicleStatistics(vehicles);

  const metrics = [
    {
      label: "Total Vehicles",
      value: statistics.total,
      icon: Bike,
      color: "green",
    },
    {
      label: "Active",
      value: statistics.active,
      icon: CheckCircle2,
      color: "green",
    },
    {
      label: "Draft",
      value: statistics.draft,
      icon: FileText,
      color: "blue",
    },
    {
      label: "Maintenance",
      value: statistics.maintenance,
      icon: Wrench,
      color: "orange",
    },
    {
      label: "Archived",
      value: statistics.archived,
      icon: Archive,
      color: "neutral",
    },
  ];

  const actionsDisabled =
    loading || busyVehicleId !== null || panel !== null;

  return (
    <div className="vveh-page">

      {/* Page heading */}

      <div className="vveh-heading">

        <div>
          <span className="vveh-eyebrow">
            Fleet Management
          </span>

          <h1>Vehicles</h1>

          <p>
            Manage your electric fleet, battery
            specifications and operational status.
          </p>
        </div>

        <div className="vveh-button-group">

          <button
            type="button"
            className="vveh-secondary-button"
            disabled={actionsDisabled}
            onClick={() => openPanel("import")}
          >
            <Upload size={18} />
            Import Fleet
          </button>

          <button
            type="button"
            className="vveh-primary-button"
            disabled={actionsDisabled}
            onClick={() => openPanel("create")}
          >
            <Plus size={19} />
            Register Vehicle
          </button>

        </div>

      </div>

      {/* Notifications */}

      {success && (
        <div className="vveh-success" role="status">
          <CheckCircle2 size={20} />

          <span>{success}</span>

          <button
            type="button"
            className="vveh-icon-button"
            aria-label="Dismiss notification"
            onClick={() => setSuccess("")}
          >
            <X size={17} />
          </button>
        </div>
      )}

      {(error || loadError) && (
        <div className="vveh-error" role="alert">
          {error || loadError}
        </div>
      )}

      {assignmentError && (
        <div className="vveh-info" role="status">
          Driver assignment information is currently
          unavailable.
        </div>
      )}

      {/* Fleet statistics */}

      <div className="vveh-metrics">

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
                      loading || loadError ? null : metric.value
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
                <MetricIcon size={22} />
              </div>

            </article>
          );
        })}

      </div>

      {/* Registration and configuration */}

      {/* Vehicle registration modal */}

      {panel === "create" && (
        <GlassModal
          title="Register Vehicle"
          subtitle="Register a new electric vehicle in your fleet."
          size="lg"
          showFooter={false}
          dismissible={!vehicleSaving}
          onClose={closePanel}
        >
          {({ requestClose, finish }) => (
            <VehicleForm
              key="new"
              onClose={requestClose}
              onSavingChange={setVehicleSaving}
              onSaved={(message) =>
                finish(() => handleSaved(message))
              }
            />
          )}
        </GlassModal>
      )}

      {/* Vehicle configuration modal */}

      {panel === "edit" && selectedVehicle && (
        <GlassModal
          title={`Configure ${selectedVehicle.fleet_id}`}
          subtitle="Update vehicle specifications and telemetry configuration."
          size="lg"
          showFooter={false}
          dismissible={!vehicleSaving}
          onClose={closePanel}
        >
          {({ requestClose, finish }) => (
            <VehicleForm
              key={selectedVehicle.id}
              vehicle={selectedVehicle}
              onClose={requestClose}
              onSavingChange={setVehicleSaving}
              onSaved={(message) =>
                finish(() => handleSaved(message))
              }
            />
          )}
        </GlassModal>
      )}

      {/* Vehicle details */}

      {panel === "details" && selectedVehicle && (
        <GlassModal
          title="Vehicle Profile"
          subtitle="Vehicle specifications and energy intelligence"
          size="lg"
          onClose={closePanel}
        >
          <VehicleDetails
            vehicle={selectedVehicle}
            assignment={selectedAssignment}
          />
        </GlassModal>
      )}

      {/* CSV fleet import */}

      {/* Bulk fleet import modal */}

      {panel === "import" && (
        <GlassModal
          title="Import Fleet"
          subtitle="Register multiple electric vehicles using a CSV file."
          size="lg"
          showFooter={false}
          dismissible={!importBusy}
          onClose={closePanel}
        >
          {({ requestClose, finish }) => (
            <VehicleImport
              onClose={requestClose}
              onBusyChange={setImportBusy}
              onSaved={(message) =>
                finish(() => handleSaved(message))
              }
            />
          )}
        </GlassModal>
      )}

      {/* Fleet inventory */}

      <section className="vveh-panel">

        <div className="vveh-panel-header">

          <div>
            <h2>Fleet Inventory</h2>

            <p>
              {loadError
                ? "Fleet records unavailable"
                : `${filteredVehicles.length} matching vehicles`}
            </p>
          </div>

          <button
            type="button"
            className="vveh-secondary-button"
            disabled={actionsDisabled}
            onClick={refresh}
          >
            <RefreshCw
              size={17}
              className={
                loading ? "vveh-spinning" : ""
              }
            />

            Refresh
          </button>

        </div>

        {/* Search and filters */}

        <div className="vveh-toolbar">

          <div className="vveh-search">
            <Search size={19} />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Search fleet ID, registration, manufacturer..."
              aria-label="Search vehicles"
            />
          </div>

          <select
            value={statusFilter}
            aria-label="Filter by vehicle status"
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(0);
            }}
          >
            <option value="">All Statuses</option>

            {vehicleStatuses.map((status) => (
              <option
                key={status.value}
                value={status.value}
              >
                {status.label}
              </option>
            ))}

          </select>

          <select
            value={typeFilter}
            aria-label="Filter by vehicle type"
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPage(0);
            }}
          >
            <option value="">All Vehicle Types</option>

            {vehicleTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}

          </select>

          <button
            type="button"
            className="vveh-secondary-button"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setTypeFilter("");
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
            <h3>Loading fleet inventory...</h3>
          </div>

        ) : loadError ? (

          <div className="vveh-empty">
            <Bike size={42} />
            <h3>Unable to load vehicles</h3>

            <button
              type="button"
              className="vveh-secondary-button"
              onClick={refresh}
            >
              Try Again
            </button>
          </div>

        ) : visibleVehicles.length === 0 ? (

          <div className="vveh-empty">

            <Bike size={42} />

            <h3>No vehicles found</h3>

            <p>
              Register a vehicle or adjust your filters.
            </p>

            <button
              type="button"
              className="vveh-primary-button"
              disabled={actionsDisabled}
              onClick={() => openPanel("create")}
            >
              <Plus size={18} />
              Register Vehicle
            </button>

          </div>

        ) : (

          <div className="vveh-table-wrapper">

            <table className="vveh-table">

              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Registration</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Battery Charge</th>
                  <th>Telemetry</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {visibleVehicles.map((vehicle) => {
                  const status =
                    getVehicleStatus(vehicle.status);

                  const permissions =
                    getVehiclePermissions(vehicle);

                  const assignment = assignments.find(
                    (item) =>
                      item.vehicle_id === vehicle.id
                  );

                  const busy =
                    busyVehicleId === vehicle.id;

                  return (
                    <tr key={vehicle.id}>

                     <td>
                        <button
                          type="button"
                          className="vveh-table-identity vveh-identity-link"
                          onClick={() => openPanel("details", vehicle)}
                          disabled={actionsDisabled}
                          title={`View ${vehicle.fleet_id}`}
                          aria-label={`View vehicle ${vehicle.fleet_id}`}
                        >
                          <div className="vveh-driver-avatar">

                            {assignment ? (
                              <span>
                                D{assignment.driver_id}
                              </span>
                            ) : (
                              <UserRound size={23} />
                            )}

                          </div>

                          <div className="vveh-identity-details">

                            <strong>
                              {vehicle.fleet_id}
                            </strong>

                            <small>
                              {vehicle.manufacturer} {vehicle.model}
                            </small>

                            <span className="vveh-driver-label">
                              {assignmentError
                                ? "Driver unavailable"
                                : assignment
                                  ? `Driver #${assignment.driver_id}`
                                  : "Unassigned"}
                            </span>

                          </div>

                          <ChevronRight
                            size={17}
                            className="vveh-identity-arrow"
                          />

                        </button>
                     </td>

                      <td>
                        {vehicle.registration_number}
                      </td>

                      <td>
                        {formatLabel(vehicle.vehicle_type)}
                      </td>

                      <td>
                        {vehicle.battery_capacity_kwh}
                        {" kWh"}
                      </td>

                      <td>
                        <BatteryIndicator
                          level={vehicle.battery_level}
                          size="md"
                        />
                      </td>

                      <td>
                        {formatLabel(
                          vehicle.telemetry_source
                        )}
                      </td>

                      <td>
                        {assignmentError
                          ? "Unknown"
                          : assignment
                            ? `Driver #${assignment.driver_id}`
                            : "Unassigned"}
                      </td>

                      <td>
                        <span
                          className={
                            `vveh-badge vveh-${status.color}`
                          }
                        >
                          {status.label}
                        </span>
                      </td>

                      <td>

                        <div className="vveh-table-actions">

                          <button
                            type="button"
                            className="vveh-icon-button"
                            title="View vehicle"
                            aria-label={`View ${vehicle.fleet_id}`}
                            disabled={actionsDisabled}
                            onClick={() =>
                              openPanel("details", vehicle)
                            }
                          >
                            <Eye size={18} />
                          </button>

                          {permissions.canEdit && (
                            <button
                              type="button"
                              className="vveh-icon-button"
                              title="Configure vehicle"
                              aria-label={`Configure ${vehicle.fleet_id}`}
                              disabled={actionsDisabled}
                              onClick={() =>
                                openPanel("edit", vehicle)
                              }
                            >
                              <Pencil size={17} />
                            </button>
                          )}

                          {permissions.canActivate && (
                            <button
                              type="button"
                              className="vveh-icon-button vveh-action-green"
                              title="Activate vehicle"
                              aria-label={`Activate ${vehicle.fleet_id}`}
                              disabled={actionsDisabled}
                              onClick={() =>
                                handleLifecycle(
                                  vehicle,
                                  "activate"
                                )
                              }
                            >
                              <Play size={17} />
                            </button>
                          )}

                          {permissions.canEnterMaintenance && (
                            <button
                              type="button"
                              className="vveh-icon-button vveh-action-orange"
                              title="Enter maintenance"
                              aria-label={`Move ${vehicle.fleet_id} to maintenance`}
                              disabled={
                                actionsDisabled ||
                                Boolean(assignment) ||
                                assignmentError
                              }
                              onClick={() =>
                                handleLifecycle(
                                  vehicle,
                                  "maintenance"
                                )
                              }
                            >
                              <Wrench size={17} />
                            </button>
                          )}

                          {permissions.canReturnToService && (
                            <button
                              type="button"
                              className="vveh-icon-button vveh-action-green"
                              title="Return to service"
                              aria-label={`Return ${vehicle.fleet_id} to service`}
                              disabled={actionsDisabled}
                              onClick={() =>
                                handleLifecycle(
                                  vehicle,
                                  "return"
                                )
                              }
                            >
                              <CheckCircle2 size={17} />
                            </button>
                          )}

                          {permissions.canArchive && (
                            <button
                              type="button"
                              className="vveh-icon-button"
                              title="Archive vehicle"
                              aria-label={`Archive ${vehicle.fleet_id}`}
                              disabled={
                                actionsDisabled ||
                                Boolean(assignment) ||
                                assignmentError
                              }
                              onClick={() =>
                                handleLifecycle(
                                  vehicle,
                                  "archive"
                                )
                              }
                            >
                              <Archive size={17} />
                            </button>
                          )}

                          {busy && (
                            <RefreshCw
                              size={16}
                              className="vveh-spinning"
                            />
                          )}

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

        {/* Pagination */}

        <div className="vveh-pagination">

          <span>
            Page {currentPage + 1} of {totalPages}
            {" · "}
            {filteredVehicles.length} vehicles
          </span>

          <div className="vveh-button-group">

            <button
              type="button"
              className="vveh-secondary-button"
              disabled={currentPage === 0 || loading}
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
                currentPage >= totalPages - 1 ||
                loading
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

    </div>
  );
}
