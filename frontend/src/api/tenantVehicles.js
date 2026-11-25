import api from "./client.js";

const BASE_PATH = "/tenant/vehicles";

/* ==========================================
   VEHICLE INVENTORY
   ========================================== */

export async function getVehicles(signal, params = {}) {
    const response = await api.get(`${BASE_PATH}`, { params, signal });
    return response.data;
}

export async function getAllVehicles(signal) {
    const limit = 100;
    const vehicles = [];

    let offset = 0;

    while (true){
        const records = await getVehicles(signal, { limit, offset });
        vehicles.push(...records);

        if (records.length < limit){
            break;
        }

        offset += limit;
    }
    return vehicles;
}

export async function getVehicle(vehicleId) {
  const response = await api.get(
    `${BASE_PATH}/${vehicleId}`
  );

  return response.data;
}

/* ==========================================
   VEHICLE REGISTRATION AND CONFIGURATION
   ========================================== */

export async function createVehicle(payload) {
  const response = await api.post(
    `${BASE_PATH}/`,
    payload
  );

  return response.data;
}

export async function updateVehicle(vehicleId, payload) {
  const response = await api.patch(
    `${BASE_PATH}/${vehicleId}`,
    payload
  );

  return response.data;
}

/* ==========================================
   VEHICLE LIFECYCLE
   ========================================== */

export async function activateVehicle(vehicleId) {
  const response = await api.post(
    `${BASE_PATH}/${vehicleId}/activate`
  );

  return response.data;
}

export async function enterVehicleMaintenance(vehicleId) {
  const response = await api.post(
    `${BASE_PATH}/${vehicleId}/enter-maintenance`
  );

  return response.data;
}

export async function returnVehicleToService(vehicleId) {
  const response = await api.post(
    `${BASE_PATH}/${vehicleId}/return-to-service`
  );

  return response.data;
}

export async function archiveVehicle(vehicleId) {
  const response = await api.post(
    `${BASE_PATH}/${vehicleId}/archive`
  );

  return response.data;
}

/* ==========================================
   BULK CSV IMPORT
   ========================================== */

export async function previewVehicleImport(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    `${BASE_PATH}/import/preview`,
    formData
  );

  return response.data;
}

export async function commitVehicleImport(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    `${BASE_PATH}/import/commit`,
    formData
  );

  return response.data;
}

/* ==========================================
   DRIVER ASSIGNMENTS
   ========================================== */

export async function getVehicleAssignments(signal) {
  const response = await api.get(
    "/tenant/vehicle-assignments/",
    { signal }
  );

  return response.data;
}

export async function getVehicleAssignmentHistory(signal) {
  const response = await api.get(
    "/tenant/vehicle-assignments/history",
    { signal }
  );

  return response.data;
}

export async function createVehicleAssignment(payload) {
  const response = await api.post(
    "/tenant/vehicle-assignments/",
    payload
  );

  return response.data;
}

export async function releaseVehicleAssignment(assignmentId) {
  const response = await api.post(
    `/tenant/vehicle-assignments/${assignmentId}/release`
  );

  return response.data;
}

/* ==========================================
   SIMULATED TELEMETRY
   ========================================== */

export async function submitVehicleTelemetry(
  vehicleId,
  payload
) {
  const response = await api.post(
    `${BASE_PATH}/${vehicleId}/telemetry`,
    payload
  );

  return response.data;
}

/* ==========================================
   API ERROR HANDLING
   ========================================== */

export function getVehicleError(error) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((issue) => {
        const field = issue.loc?.slice(1).join(".");

        return field
          ? `${field}: ${issue.msg}`
          : issue.msg;
      })
      .join("; ");
  }

  if (detail && typeof detail === "object") {
    return detail.message || "Vehicle validation failed.";
  }

  return error.message || "Unable to complete vehicle request.";
}