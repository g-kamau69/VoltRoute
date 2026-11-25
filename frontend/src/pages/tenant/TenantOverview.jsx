import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  Bike,
  Users,
  Package,
  Route,
  ArrowRight,
  MapPin,
  Zap,
  Navigation,
  MessagesSquare,
} from "lucide-react";

import {
  tenantHomePaths,
  tenantRoleLabels,
} from "../../config/tenantNavigation";

import { getAllVehicles } from "../../api/tenantVehicles";
import AnimatedNumber from "../../components/common/AnimatedNumber";
import { getOrderSummary } from "../../api/tenantOrders.js";
import { getDriverSummary } from "../../api/tenantDrivers";
import BatteryIndicator from "../../components/common/BatteryIndicator";

import "./TenantOverview.css";


export default function TenantOverview({ session }) {
  const user = session.user;

  /* ==========================================
     DASHBOARD STATE
     ========================================== */

  const [orderSummary, setOrderSummary] = useState(null);

  const [orderSummaryError, setOrderSummaryError] =
    useState(false);
  const [driverSummary, setDriverSummary] = useState(null);

  const [driverSummaryError, setDriverSummaryError] =
    useState(false);

  const [fleetVehicles, setFleetVehicles] =
    useState(null);

  const [fleetError, setFleetError] = useState(false);


  /* ==========================================
     LOAD DASHBOARD DATA
     ========================================== */

  useEffect(() => {
    const controller = new AbortController();

    /* Load order statistics */

    async function loadOrderSummary() {
      try {
        const data = await getOrderSummary(
          controller.signal
        );

        if (!controller.signal.aborted) {
          setOrderSummary(data);
          setOrderSummaryError(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setOrderSummary(null);
          setOrderSummaryError(true);
        }
      }
    }

    /* Load fleet inventory */

    async function loadFleet() {
      try {
        const data = await getAllVehicles(
          controller.signal
        );

        if (!controller.signal.aborted) {
          setFleetVehicles(data);
          setFleetError(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setFleetVehicles(null);
          setFleetError(true);
        }
      }
    }

    async function loadDriverSummary() {
      try{
        const data = await getDriverSummary(
          controller.signal
        );

        if (!controller.signal.aborted) {
          setDriverSummary(data);
          setDriverSummaryError(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setDriverSummary(null);
          setDriverSummaryError(true);
        }
      }
    }

    loadOrderSummary();
    loadFleet();
    loadDriverSummary();

    return () => controller.abort();

  }, []);


  /* ==========================================
     FLEET STATISTICS
     ========================================== */

  const activeFleet = (fleetVehicles ?? []).filter(
    (vehicle) => vehicle.status === "active"
  );

  const totalVehicles =
    fleetVehicles?.length ?? "—";


  /* ==========================================
     BATTERY STATISTICS
     ========================================== */

  const batteryReadings = activeFleet
    .filter(
      (vehicle) =>
        vehicle.battery_level !== null &&
        vehicle.battery_level !== undefined &&
        vehicle.battery_level !== ""
    )
    .map(
      (vehicle) => Number(vehicle.battery_level)
    )
    .filter(
      (level) =>
        Number.isFinite(level) &&
        level >= 0 &&
        level <= 100
    );

  const averageBatteryLevel =
    batteryReadings.length > 0
      ? Math.round(
          batteryReadings.reduce(
            (sum, level) => sum + level,
            0
          ) / batteryReadings.length
        )
      : null;

  const lowBatteryVehicles =
    fleetVehicles === null
      ? "—"
      : activeFleet.length > 0 &&
          batteryReadings.length === 0
        ? "—"
        : batteryReadings.filter(
            (level) => level <= 30
          ).length;


  /* ==========================================
     USER AND WORKSPACE INFORMATION
     ========================================== */

  const isCompanyAdmin =
    user.role === "tenant_admin";

  const basePath = tenantHomePaths[user.role];

  const firstName =
    user.full_name?.trim().split(/\s+/)[0] ||
    "User";


  /* ==========================================
     DASHBOARD METRIC CARDS
     ========================================== */

  const metrics = [
    {
      label: "Total Vehicles",

      value: totalVehicles,

      description: fleetError
        ? "Unable to load fleet statistics"
        : fleetVehicles === null
          ? "Loading fleet statistics..."
          : `${activeFleet.length} active vehicles`,

      icon: Bike,
      color: "green",
      path: "vehicles",
    },

    {
      label: "Active Drivers",
      value: driverSummary?.active_drivers ?? "—",

      description: driverSummaryError
        ? "Unable to load driver statistics"
        : driverSummary === null
          ? "Loading driver statistics..."
          : `${driverSummary.total_drivers} registered drivers`,

      icon: Users,
      color: "blue",
      path: "drivers",
},

    {
      label: "Pending Orders",

      value: orderSummary?.pending ?? "—",

      description: orderSummaryError
        ? "Unable to load order statistics"
        : orderSummary === null
          ? "Loading order statistics..."
          : "Orders awaiting dispatch",

      icon: Package,
      color: "orange",
      path: "orders",
    },

    {
      label: "Active Trips",

      value: "—",

      description: "Currently in progress",

      icon: Route,
      color: "purple",
      path: "routes",
    },
  ];


  /* ==========================================
     QUICK ACTIONS
     ========================================== */

  const quickActions = [
    {
      label: "Manage Vehicles",

      description:
        "Register and manage electric vehicles.",

      icon: Bike,
      path: "vehicles",
    },

    {
      label: "Manage Orders",

      description:
        "Create and monitor delivery orders.",

      icon: Package,
      path: "orders",
    },

    {
      label: "Dispatch Center",

      description:
        "Assign vehicles to delivery operations.",

      icon: Navigation,
      path: "dispatch",
    },

    {
      label: "Messages",

      description:
        "Communicate with your fleet team.",

      icon: MessagesSquare,
      path: "messages",
    },
  ];


  /* ==========================================
     DASHBOARD INTERFACE
     ========================================== */

  return (
    <div className="vto-page">

      {/* Page Heading */}

      <div className="vto-heading">

        <div>

          <div className="vto-eyebrow">
            {tenantRoleLabels[user.role]}
          </div>

          <h1>
            {isCompanyAdmin
              ? "Company Overview"
              : "Fleet Operations"}
          </h1>

          <p>
            Welcome, {firstName}.{" "}

            {isCompanyAdmin
              ? "Manage your organization and electric fleet."
              : "Monitor and coordinate your daily fleet operations."}
          </p>

        </div>

        <Link
          to={`${basePath}/orders`}
          className="vto-primary-button"
        >
          <Package size={18} />

          Manage Orders

          <ArrowRight size={16} />
        </Link>

      </div>


      {/* Fleet Statistics */}

      <div className="vto-metrics">

        {metrics.map((metric) => {
          const MetricIcon = metric.icon;

          return (
            <Link
              key={metric.label}
              to={`${basePath}/${metric.path}`}
              className="vto-metric-card"
            >

              <div className="vto-metric-top">

                <span>{metric.label}</span>

                <div
                  className={
                    `vto-metric-icon vto-${metric.color}`
                  }
                >
                  <MetricIcon size={21} />
                </div>

              </div>

              <strong className="vto-metric-value">
                <AnimatedNumber
                  value={metric.value}
                  duration={1400}
                />
              </strong>

              <span className="vto-metric-description">
                {metric.description}
              </span>

            </Link>
          );
        })}

      </div>


      {/* Operational Overview */}

      <div className="vto-operational-grid">

        {/* Live Fleet Overview */}

        <section className="vto-panel">

          <div className="vto-panel-heading">

            <div>

              <h2>Live Fleet Overview</h2>

              <p>
                Vehicle locations and operational status
              </p>

            </div>

            <Link
              to={`${basePath}/tracking`}
              className="vto-text-link"
            >
              View fleet

              <ArrowRight size={16} />
            </Link>

          </div>

          <div className="vto-empty-map">

            <div className="vto-empty-icon">
              <MapPin size={32} />
            </div>

            <h3>Fleet Tracking</h3>

            <p>
              Vehicle locations will appear here once
              the telemetry and mapping services
              are connected.
            </p>

          </div>

        </section>


        {/* Energy Intelligence */}

        <section className="vto-panel">

          <div className="vto-panel-heading">

            <div>

              <h2>Energy Intelligence</h2>

              <p>Battery and energy performance</p>

            </div>

            <div className="vto-metric-icon vto-green">
              <Zap size={21} />
            </div>

          </div>


          {/* Average Battery Charge */}

          <div className="vto-energy-row">

            <span>Average stored battery level</span>

            <BatteryIndicator
              level={averageBatteryLevel}
              size="md"
            />

          </div>


          {/* Low Battery Vehicles */}

          <div className="vto-energy-row">

            <span>
              Active vehicles with low battery
            </span>

            <strong
              className={
                typeof lowBatteryVehicles === "number" &&
                lowBatteryVehicles > 0
                  ? "vto-energy-warning"
                  : ""
              }
            >
              {lowBatteryVehicles}
            </strong>

          </div>


          {/* Energy Consumption */}

          <div className="vto-energy-row">

            <span>Energy consumption today</span>

            <strong>—</strong>

          </div>


          {/* Swap Station Availability */}

          <div className="vto-energy-row">

            <span>Available swap stations</span>

            <strong>—</strong>

          </div>


          {/* Battery Data Information */}

          <div
            className="vto-battery-information"
            role="status"
          >

            {fleetError
              ? "Unable to retrieve fleet battery information."

              : fleetVehicles === null
                ? "Loading fleet battery information..."

                : activeFleet.length === 0
                  ? "No active vehicles available for battery monitoring."

                  : batteryReadings.length === 0
                    ? "No valid battery readings available."

                    : `Based on stored battery levels from ${batteryReadings.length} of ${activeFleet.length} active vehicles.`}

          </div>


          {/* Energy Intelligence Navigation */}

          <Link
            to={`${basePath}/energy`}
            className="vto-secondary-button"
          >
            Open Energy Intelligence

            <ArrowRight size={16} />
          </Link>

        </section>

      </div>


      {/* Quick Actions */}

      <section className="vto-actions-section">

        <div className="vto-section-heading">

          <h2>Quick Actions</h2>

          <p>
            Access your essential operational tools.
          </p>

        </div>

        <div className="vto-actions-grid">

          {quickActions.map((action) => {
            const ActionIcon = action.icon;

            return (
              <Link
                key={action.path}
                to={`${basePath}/${action.path}`}
                className="vto-action-card"
              >

                <div className="vto-action-icon">
                  <ActionIcon size={22} />
                </div>

                <h3>{action.label}</h3>

                <p>{action.description}</p>

                <ArrowRight
                  size={18}
                  className="vto-action-arrow"
                />

              </Link>
            );
          })}

        </div>

      </section>

    </div>
  );
}
