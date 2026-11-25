import api from "./client.js";

const BASE_PATH = "/tenant/drivers";

export async function getDrivers(params = {}, signal) {
  const response = await api.get(`${BASE_PATH}/`, {
    params,
    signal,
  });

  return response.data;
}

export async function getDriver(driverId, signal) {
  const response = await api.get(
    `${BASE_PATH}/${driverId}`,
    { signal }
  );

  return response.data;
}

export async function getDriverSummary(signal) {
  const response = await api.get(
    `${BASE_PATH}/summary`,
    { signal }
  );

  return response.data;
}

export async function getAllDrivers(signal) {
  const drivers = [];
  const limit = 100;

  let offset = 0;

  while (true) {
    const records = await getDrivers(
      { limit, offset },
      signal
    );

    drivers.push(...records);

    if (records.length < limit) {
      break;
    }

    offset += limit;
  }

  return drivers;
}

export function getDriverError(error) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg)
      .join("; ");
  }

  return error.message ||
    "Unable to complete driver request.";
}