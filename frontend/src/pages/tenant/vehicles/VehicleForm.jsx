import { useState, useId } from "react";
import {
  GlassModalFooter,
} from "../../../components/common/GlassModal";
import {
  Bike,
  Save,
  BatteryCharging,
  Radio,
} from "lucide-react";

import {
  createVehicle,
  updateVehicle,
  getVehicleError,
} from "../../../api/tenantVehicles";

import BatteryIndicator from "../../../components/common/BatteryIndicator";

const vehicleTypes = [
  ["electric_motorcycle", "Electric Motorcycle"],
  ["electric_scooter", "Electric Scooter"],
  ["electric_tuk_tuk", "Electric Tuk-Tuk"],
  ["electric_van", "Electric Van"],
];

const identificationFields = [
  {
    name: "fleet_id",
    label: "Fleet ID",
    minLength: 2,
    maxLength: 50,
    placeholder: "EV-001",
    required: true,
  },
  {
    name: "registration_number",
    label: "Registration Number",
    minLength: 3,
    maxLength: 50,
    placeholder: "Registration number",
    required: true,
  },
  {
    name: "manufacturer",
    label: "Manufacturer",
    minLength: 2,
    maxLength: 100,
    placeholder: "Vehicle manufacturer",
    required: true,
  },
  {
    name: "model",
    label: "Vehicle Model",
    minLength: 2,
    maxLength: 100,
    placeholder: "Vehicle model",
    required: true,
  },
  {
    name: "vin",
    label: "VIN (Optional)",
    maxLength: 100,
    placeholder: "Vehicle identification number",
  },
];

function initialForm(vehicle) {
  return {
    fleet_id: vehicle?.fleet_id ?? "",
    registration_number:
      vehicle?.registration_number ?? "",
    manufacturer: vehicle?.manufacturer ?? "",
    model: vehicle?.model ?? "",
    vin: vehicle?.vin ?? "",

    vehicle_type:
      vehicle?.vehicle_type ?? "electric_motorcycle",

    battery_capacity_kwh:
      vehicle?.battery_capacity_kwh ?? "",

    battery_level:
      vehicle?.battery_level ?? 100,

    energy_consumption_wh_per_km:
      vehicle?.energy_consumption_wh_per_km ?? "",

    battery_configuration:
      vehicle?.battery_configuration ?? "swappable",

    telemetry_source:
      vehicle?.telemetry_source ?? "simulated",
  };
}

export default function VehicleForm({
  vehicle,
  onClose,
  onSaved,
  onSavingChange,
}) {
  const formId = useId();
  const editing = Boolean(vehicle);

  const [form, setForm] = useState(
    () => initialForm(vehicle)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSaving(true);
    onSavingChange?.(true);

    try {
      const payload = {
        fleet_id: form.fleet_id.trim().toUpperCase(),

        registration_number:
          form.registration_number.trim().toUpperCase(),

        manufacturer: form.manufacturer.trim(),

        model: form.model.trim(),

        vin: form.vin.trim().toUpperCase() || null,

        vehicle_type: form.vehicle_type,

        battery_capacity_kwh:
          Number(form.battery_capacity_kwh),

        energy_consumption_wh_per_km:
          Number(form.energy_consumption_wh_per_km),

        battery_configuration:
          form.battery_configuration,

        telemetry_source: form.telemetry_source,
      };

      if (
        payload.fleet_id.length < 2 ||
        payload.registration_number.length < 3 ||
        payload.manufacturer.length < 2 ||
        payload.model.length < 2
      ) {
        throw new Error(
          "Complete all required identification fields."
        );
      }

      if (
        !Number.isFinite(payload.battery_capacity_kwh) ||
        payload.battery_capacity_kwh <= 0 ||
        !Number.isFinite(
          payload.energy_consumption_wh_per_km
        ) ||
        payload.energy_consumption_wh_per_km <= 0
      ) {
        throw new Error(
          "Battery capacity and energy consumption must be greater than zero."
        );
      }

      if (editing) {
        await updateVehicle(vehicle.id, payload);
      } else {
        payload.battery_level =
          Number(form.battery_level);

        await createVehicle(payload);
      }

      onSaved(
        editing
          ? "Vehicle configuration updated successfully."
          : "Vehicle registered successfully as a draft."
      );

    } catch (requestError) {
      setError(getVehicleError(requestError));

    } finally {
      setSaving(false);
      onSavingChange?.(false);
    }
  }

  return (
    <section className="vveh-panel">

      {/* <div className="vveh-panel-header">
        <div>
          <h2>
            {editing
              ? "Configure Vehicle"
              : "Register Vehicle"}
          </h2>

          <p>
            {editing
              ? "Update vehicle technical specifications."
              : "Register a new electric vehicle in your fleet."}
          </p>
        </div>

        <button
          type="button"
          className="vveh-icon-button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close vehicle form"
        >
          <X size={21} />
        </button>
      </div> */}

      {error && (
        <div className="vveh-error" role="alert">
          {error}
        </div>
      )}

      <form id={formId} onSubmit={handleSubmit}>

        {/* Identification */}

        <div className="vveh-form-section">

          <h3>
            <Bike size={20} />
            Vehicle Identification
          </h3>

          <div className="vveh-form-grid">

            {identificationFields.map((field) => (
              <label
                className="vveh-field"
                key={field.name}
              >
                <span>{field.label}</span>

                <input
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  minLength={field.minLength}
                  maxLength={field.maxLength}
                  required={field.required}
                  disabled={saving}
                />
              </label>
            ))}

            <label className="vveh-field">
              <span>Vehicle Type</span>

              <select
                name="vehicle_type"
                value={form.vehicle_type}
                onChange={handleChange}
                disabled={saving}
              >
                {vehicleTypes.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

          </div>
        </div>

        {/* Battery specifications */}

        <div className="vveh-form-section">

          <h3>
            <BatteryCharging size={20} />
            Battery & Energy Configuration
          </h3>

          <div className="vveh-form-grid">

            <label className="vveh-field">
              <span>Battery Capacity (kWh)</span>

              <input
                type="number"
                name="battery_capacity_kwh"
                value={form.battery_capacity_kwh}
                onChange={handleChange}
                min="0.001"
                step="any"
                placeholder="e.g. 3.2"
                required
                disabled={saving}
              />

              <small>
                Total configured battery energy capacity.
              </small>
            </label>

            <label className="vveh-field">
              <span>Energy Consumption (Wh/km)</span>

              <input
                type="number"
                name="energy_consumption_wh_per_km"
                value={form.energy_consumption_wh_per_km}
                onChange={handleChange}
                min="0.001"
                step="any"
                placeholder="e.g. 45"
                required
                disabled={saving}
              />

              <small>
                Baseline energy consumption per kilometre.
              </small>
            </label>

            <label className="vveh-field">
              <span>Battery Configuration</span>

              <select
                name="battery_configuration"
                value={form.battery_configuration}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="swappable">
                  Swappable Battery
                </option>

                <option value="fixed">
                  Fixed Battery
                </option>
              </select>
            </label>

            {!editing && (
              <label className="vveh-field">
                <span>Initial Battery Charge (%)</span>

                <input
                  type="number"
                  name="battery_level"
                  value={form.battery_level}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="any"
                  required
                  disabled={saving}
                />
              </label>
            )}

          </div>

          <div className="vveh-battery-preview">

            <span>
              {editing
                ? "Stored Battery Charge"
                : "Initial Battery Charge Preview"}
            </span>

            <BatteryIndicator
              level={form.battery_level}
              size="lg"
              showStatus
            />

          </div>
        </div>

        {/* Telemetry configuration */}

        <div className="vveh-form-section">

          <h3>
            <Radio size={20} />
            Telemetry Configuration
          </h3>

          <label className="vveh-field">
            <span>Telemetry Source</span>

            <select
              name="telemetry_source"
              value={form.telemetry_source}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="none">
                Not Configured
              </option>

              <option value="simulated">
                Simulated Telemetry
              </option>

              <option value="physical">
                Physical Telemetry
              </option>
            </select>
          </label>

          <div className="vveh-info">

            {form.telemetry_source === "simulated"
              ? "The vehicle will be eligible for simulated telemetry when active."

              : form.telemetry_source === "physical"
                ? "Physical telemetry is reserved for future hardware integration."

                : "A telemetry source must be configured before activation."}

          </div>

        </div>

        <GlassModalFooter>

          <button
            type="button"
            className="vveh-secondary-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            form={formId}
            className="vveh-primary-button"
            disabled={saving}
          >
            <Save size={18} />

            {saving
              ? "Saving..."
              : editing
                ? "Save Configuration"
                : "Register as Draft"}

          </button>

        </GlassModalFooter>

      </form>
    </section>
  );
}
