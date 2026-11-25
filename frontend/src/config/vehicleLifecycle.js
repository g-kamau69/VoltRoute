export const vehicleStatuses = [
  {
    value: "draft",
    label: "Draft",
    color: "neutral",
  },
  {
    value: "active",
    label: "Active",
    color: "green",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    color: "orange",
  },
  {
    value: "archived",
    label: "Archived",
    color: "neutral",
  },
];

export function getVehicleStatus(status) {
  return (
    vehicleStatuses.find(
      (item) => item.value === status
    ) || {
      value: status,
      label: "Unknown",
      color: "neutral",
    }
  );
}

export function getVehiclePermissions(vehicle) {
  const status = vehicle?.status;

  const telemetryConfigured =
    Boolean(vehicle?.telemetry_source) &&
    vehicle.telemetry_source !== "none";

  return {
    canEdit:
      status === "draft" ||
      status === "maintenance",

    canActivate:
      status === "draft" &&
      telemetryConfigured,

    canEnterMaintenance:
      status === "active",

    canReturnToService:
      status === "maintenance" &&
      telemetryConfigured,

    canArchive:
      ["draft", "active", "maintenance"].includes(status),

    canAssignDriver:
      status === "active",

    canReceiveSimulatedTelemetry:
      status === "active" &&
      vehicle.telemetry_source === "simulated",
  };
}

export function getVehicleStatistics(vehicles = []) {
  return {
    total: vehicles.length,

    draft: vehicles.filter(
      (vehicle) => vehicle.status === "draft"
    ).length,

    active: vehicles.filter(
      (vehicle) => vehicle.status === "active"
    ).length,

    maintenance: vehicles.filter(
      (vehicle) => vehicle.status === "maintenance"
    ).length,

    archived: vehicles.filter(
      (vehicle) => vehicle.status === "archived"
    ).length,
  };
}

export function getBatteryStatus(batteryLevel) {
  if (
    batteryLevel === null ||
    batteryLevel === undefined ||
    batteryLevel === ""
  ) {
    return {
      label: "No data",
      color: "neutral",
    };
  }

  const level = Number(batteryLevel);

  if (!Number.isFinite(level) || level < 0 || level > 100) {
    return {
      label: "Invalid reading",
      color: "neutral",
    };
  }

  if (level <= 15) {
    return {
      label: "Critical",
      color: "red",
    };
  }

  if (level <= 30) {
    return {
      label: "Low",
      color: "orange",
    };
  }

  return {
    label: "Normal",
    color: "green",
  };
}