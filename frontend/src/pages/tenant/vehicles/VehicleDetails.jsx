import {
  Bike,
  BatteryCharging,
  Route,
} from "lucide-react";

import BatteryIndicator from "../../../components/common/BatteryIndicator";
import EnergyCardBackground from "../../../components/common/EnergyCardBackground";
import {
  getVehicleStatus,
} from "../../../config/vehicleLifecycle";

function formatLabel(value) {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDate(value) {
  return value
    ? new Date(value).toLocaleString()
    : "—";
}

export default function VehicleDetails({
  vehicle,
  assignment,
}) {
  const status = getVehicleStatus(vehicle.status);

  const capacity = Number(
    vehicle.battery_capacity_kwh
  );

  const level = Number(vehicle.battery_level);

  const consumption = Number(
    vehicle.energy_consumption_wh_per_km
  );

  const validEnergyData =
    vehicle.battery_level != null &&
    Number.isFinite(capacity) &&
    Number.isFinite(level) &&
    Number.isFinite(consumption) &&
    capacity > 0 &&
    consumption > 0 &&
    level >= 0 &&
    level <= 100;

  const remainingEnergy = validEnergyData
    ? capacity * level / 100
    : null;

  const estimatedRange = validEnergyData
    ? remainingEnergy * 1000 / consumption
    : null;

  const details = [
    ["Fleet ID", vehicle.fleet_id],

    ["Registration Number",
      vehicle.registration_number],

    ["Manufacturer", vehicle.manufacturer],

    ["Model", vehicle.model],

    ["Vehicle Type",
      formatLabel(vehicle.vehicle_type)],

    ["VIN", vehicle.vin],

    ["Battery Capacity", `${capacity} kWh`],

    ["Baseline Consumption",
      `${consumption} Wh/km`],

    ["Battery Configuration",
      formatLabel(vehicle.battery_configuration)],

    ["Telemetry Source",
      formatLabel(vehicle.telemetry_source)],

    ["Driver Assignment",
      assignment
        ? `Driver ID: ${assignment.driver_id}`
        : "Unassigned"],

    ["Registered", formatDate(vehicle.created_at)],

    ["Last Updated", formatDate(vehicle.updated_at)],
  ];

  return (
    <section className="vveh-panel">

      <div className="vveh-panel-header">

        <div className="vveh-vehicle-identity">

          <div className="vveh-vehicle-icon">
            <Bike size={27} />
          </div>

          <div>
            <h2>{vehicle.fleet_id}</h2>

            <p>
              {vehicle.manufacturer} {vehicle.model}
            </p>

            <span
              className={`vveh-badge vveh-${status.color}`}
            >
              {status.label}
            </span>
          </div>

        </div>

        {/* <button
          type="button"
          className="vveh-icon-button"
          aria-label="Close vehicle details"
          onClick={onClose}
        >
          <X size={22} />
        </button> */}

      </div>

     <div className="vveh-energy-grid">
      {/* Battery charge Card */}
      <article className="vveh-energy-card vveh-card-battery">
        <EnergyCardBackground variant="battery" />

        <h3>
          <BatteryCharging size={19} />
          Battery Charge
        </h3>

        <BatteryIndicator
          level={vehicle.battery_level}
          size="xl"
          showStatus
          />
        <p>Stored Battery level</p>
      </article>

      {/* Remaining energy card */}
      <article className="vveh-energy-card vveh-card-energy">
        <EnergyCardBackground variant="energy" />

        <h3>Remaining Energy</h3>

        <strong>
          {remainingEnergy === null
            ? "—" : `${remainingEnergy.toFixed(2)} kWh`}
        </strong>

        <p>Configured capacity x state of charge</p>
      </article>

      {/* Estimated range card */}
      <article className="vveh-energy-card vveh-card-range">
        <EnergyCardBackground variant="range" />
        <h3>
          <Route size={19}/>
          Estimated Range
        </h3>
        <strong>
          {estimatedRange === null
            ? "-" : `${estimatedRange.toFixed(1)} km`}
        </strong>

        <p>Theoretical range before safety reserves</p>
      </article>
     </div>

      <dl className="vveh-details-grid">

        {details.map(([label, value]) => (
          <div key={label}>

            <dt>{label}</dt>

            <dd>{value ?? "—"}</dd>

          </div>
        ))}

      </dl>

      <div className="vveh-info">
        Range estimates are preliminary and do not
        account for payload, terrain, battery degradation
        or riding conditions.
      </div>

    </section>
  );
}
