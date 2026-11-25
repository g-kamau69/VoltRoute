import { useState } from "react";

import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  GlassModalFooter,
} from "../../../components/common/GlassModal";
import {
  previewVehicleImport,
  commitVehicleImport,
  getVehicleError,
} from "../../../api/tenantVehicles";

const CSV_TEMPLATE = [
  "fleet_id,registration_number,manufacturer,model,vehicle_type,battery_capacity_kwh,energy_consumption_wh_per_km,battery_configuration,vin,battery_level,telemetry_source",
  "EV-001,DEMO-001,Demo Manufacturer,Demo Model,electric_motorcycle,3.2,45,swappable,,100,simulated",
].join("\n");

function downloadTemplate() {
  const blob = new Blob(
    [CSV_TEMPLATE],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "voltroute_vehicle_template.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function formatRowError(issue) {
  if (typeof issue === "string") {
    return issue;
  }

  return `${issue.field || "Record"}: ${issue.message || "Invalid value"}`;
}

export default function VehicleImport({
  onBusyChange,
  onSaved,
  onClose,
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(event) {
    const selectedFile =
      event.target.files?.[0] || null;

    setPreview(null);
    setError("");
    setFile(null);

    if (!selectedFile) return;

    if (
      !selectedFile.name.toLowerCase().endsWith(".csv")
    ) {
      setError("Select a valid CSV file.");
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("CSV file must not exceed 2 MB.");
      return;
    }

    setFile(selectedFile);
  }

  async function handlePreview() {
    if (!file || busy) return;

    setBusy(true);
    onBusyChange?.(true);
    setPreview(null);
    setError("");

    try {
      const result = await previewVehicleImport(file);
      setPreview(result);

    } catch (requestError) {
      setError(getVehicleError(requestError));

    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  async function handleImport() {
    if (
      !file ||
      !preview ||
      preview.error_count > 0 ||
      preview.valid_count === 0 ||
      busy
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Import ${preview.valid_count} vehicles as drafts?`
    );

    if (!confirmed) return;

    setBusy(true);
    onBusyChange?.(true);
    setError("");

    try {
      const result = await commitVehicleImport(file);

      onSaved(
        `${result.imported_count} vehicles imported successfully.`
      );

    } catch (requestError) {
      setError(getVehicleError(requestError));

      setPreview(null);

    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return (
    <section className="vveh-panel">

      <div className="vveh-panel-header">
        <div>

          <h2>Import Fleet</h2>

          <p>
            Register multiple vehicles using a CSV file.
          </p>

        </div>

        <button
          type="button"
          className="vveh-icon-button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close fleet import"
        >
          <X size={21} />
        </button>
      </div>

      {error && (
        <div className="vveh-error" role="alert">
          {error}
        </div>
      )}

      <div className="vveh-import-zone">

        <FileSpreadsheet size={42} />

        <h3>Upload Vehicle Inventory</h3>

        <p>
          UTF-8 CSV files only. Maximum 2 MB and
          1,000 vehicle records.
        </p>

        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="Upload vehicle CSV"
          onChange={handleFileChange}
          disabled={busy}
        />

        {file && (
          <strong>{file.name}</strong>
        )}

        <div className="vveh-button-group">

          <button
            type="button"
            className="vveh-secondary-button"
            onClick={downloadTemplate}
          >
            <Download size={17} />
            Download Template
          </button>

          <button
            type="button"
            className="vveh-primary-button"
            onClick={handlePreview}
            disabled={!file || busy}
          >
            <Upload size={17} />

            {busy ? "Processing..." : "Validate CSV"}
          </button>

        </div>

      </div>

      {preview && (
        <div className="vveh-import-result">

          <div className="vveh-metrics">

            {[
              ["Total Records", preview.total_rows],
              ["Valid Records", preview.valid_count],
              ["Invalid Records", preview.error_count],
            ].map(([label, value]) => (
              <article
                className="vveh-metric"
                key={label}
              >
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}

          </div>

          {preview.errors?.length > 0 && (
            <div className="vveh-error-list">

              <h3>Validation Errors</h3>

              {preview.errors.map((item, index) => (
                <div
                  key={`${item.row}-${index}`}
                  className="vveh-error"
                >
                  <strong>Row {item.row}</strong>

                  <div>
                    {item.errors
                      .map(formatRowError)
                      .join("; ")}
                  </div>

                </div>
              ))}

            </div>
          )}

          {preview.valid_rows?.length > 0 && (
            <div className="vveh-table-wrapper">

              <table className="vveh-table">

                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Fleet ID</th>
                    <th>Registration</th>
                    <th>Manufacturer</th>
                    <th>Model</th>
                    <th>Capacity</th>
                  </tr>
                </thead>

                <tbody>

                  {preview.valid_rows
                    .slice(0, 20)
                    .map((item) => (
                      <tr key={item.row}>
                        <td>{item.row}</td>

                        <td>{item.vehicle.fleet_id}</td>

                        <td>
                          {item.vehicle.registration_number}
                        </td>

                        <td>
                          {item.vehicle.manufacturer}
                        </td>

                        <td>{item.vehicle.model}</td>

                        <td>
                          {item.vehicle.battery_capacity_kwh}
                          {" kWh"}
                        </td>
                      </tr>
                    ))}

                </tbody>

              </table>

            </div>
          )}

          <p className="vveh-muted">
            Preview displays up to 20 valid records.
            All validated records will be imported.
          </p>

         

        </div>
      )}

      <GlassModalFooter>

        <button
          type="button"
          className="vveh-secondary-button"
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </button>

        <button
          type="button"
          className="vveh-primary-button"
          onClick={handleImport}
          disabled={
            busy ||
            !preview ||
            preview.error_count > 0 ||
            preview.valid_count === 0
          }
        >
          <CheckCircle2 size={18} />

          {busy
            ? "Processing..."
            : preview
              ? `Import ${preview.valid_count} Vehicles`
              : "Import Vehicles"}

        </button>

        </GlassModalFooter>
    </section>
  );
}
