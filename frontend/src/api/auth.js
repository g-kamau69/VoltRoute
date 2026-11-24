import api from "./client.js";

export async function loginPlatform(email, password) {
  const response = await api.post("/platform/auth/login", {
    email,
    password,
  });

  return response.data;
}

export async function loginTenant(tenantId, email, password) {
  const response = await api.post("/tenant/auth/login", {
    tenant_id: Number(tenantId),
    email,
    password,
  });

  return response.data;
}

export async function getPlatformProfile(accessToken) {
  const response = await api.get("/platform/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
}

export async function getTenantProfile(accessToken) {
  const response = await api.get("/tenant/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
}

export async function authenticatePlatform(email, password) {
  const { access_token: accessToken } = await loginPlatform(
    email,
    password,
  );

  const user = await getPlatformProfile(accessToken);

  return {
    accessToken,
    accountType: "platform",
    user,
  };
}

export async function authenticateTenant(
  tenantId,
  email,
  password,
) {
  const { access_token: accessToken } = await loginTenant(
    tenantId,
    email,
    password,
  );

  const user = await getTenantProfile(accessToken);

  return {
    accessToken,
    accountType: "tenant",
    user,
  };
}


export async function acceptTenantInvitation(
  invitationToken,
  password
){
  const response = await api.post(
    "/tenant-invitations/accept",
    {
      invitation_token: invitationToken.trim(),
      password,
    }
  );
  return response.data;
}