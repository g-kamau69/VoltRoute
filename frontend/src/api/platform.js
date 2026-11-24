
import api from "./client.js";

// ============================================
// PLATFORM ORGANIZATION MANAGEMENT
// ============================================

export async function getPlatformTenants({
  limit = 50,
  offset = 0,
  statusFilter = null,
} = {}) {
  const response = await api.get("/platform/tenants/", {
    params: {
      limit,
      offset,
      ...(statusFilter ? { status_filter: statusFilter } : {}),
    },
  });

  return response.data;
}

// ============================================
// ORGANIZATION REGISTRATION REQUESTS
// ============================================

export async function getTenantRegistrationRequests({
  limit = 50,
  offset = 0,
  statusFilter = null,
} = {}) {
  const response = await api.get(
    "/platform/tenant-requests/",
    {
      params: {
        limit,
        offset,
        ...(statusFilter
          ? { status_filter: statusFilter }
          : {}),
      },
    }
  );

  return response.data;
}

// Fetch registration requests by status.
// Supports pagination and prevents infinite loops.


export async function getRegistrationRequestsByStatus(status) {
  const allowedStatuses = ["pending", "approved", "rejected"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid registration status");
  }

  const results = [];
  const limit = 100;
  let offset = 0;

  while (true) {
    const page = await getTenantRegistrationRequests({
      limit,
      offset,
      statusFilter: status,
    });

    if (!Array.isArray(page)) {
      throw new Error("Unexpected registration response format");
    }

    results.push(...page);

    if (page.length < limit) {
      break;
    }

    offset += page.length;
  }

  return results;
}


// Fetch only pending organization registrations.

export async function getPendingRegistrationRequests() {
  return getRegistrationRequestsByStatus("pending");
}

// ============================================
// REGISTRATION APPROVAL AND REJECTION
// ============================================

export async function approveRegistrationRequest(
  requestId,
  reviewNotes = ""
) {
  const response = await api.post(
    `/platform/tenant-requests/${requestId}/approve`,
    {
      review_notes: reviewNotes.trim(),
    }
  );

  return response.data;
}

export async function rejectRegistrationRequest(
  requestId,
  reviewNotes = ""
) {
  const response = await api.post(
    `/platform/tenant-requests/${requestId}/reject`,
    {
      review_notes: reviewNotes.trim(),
    }
  );

  return response.data;
}

// ============================================
// PLATFORM DASHBOARD STATISTICS
// ============================================

export async function getPlatformDashboardStats() {
  const response = await api.get(
    "/platform/dashboard/stats"
  );

  return response.data;
}

// ============================================
// ORGANIZATION SUSPENSION AND REACTIVATION
// ============================================

export async function suspendCompany(companyId) {
  const response = await api.post(
    `/platform/tenants/${companyId}/suspend`
  );

  return response.data;
}

export async function reactivateCompany(companyId) {
  const response = await api.post(
    `/platform/tenants/${companyId}/reactivate`
  );

  return response.data;
}

// ============================================
// ORGANIZATION USER INVITATIONS
// ============================================

export async function createTenantInvitation(
  tenantId,
  {
    fullName,
    email,
    role = "tenant_admin",
  }
) {
  const response = await api.post(
    `/platform/tenants/${tenantId}/invitations`,
    {
      full_name: fullName.trim(),
      email: email.trim(),
      role,
    }
  );

  return response.data;
}


export async function getRegistrationChecks(requestId) {
  const response = await api.get(
    `/platform/tenant-requests/${requestId}/checks`
  );

  return response.data;
}
