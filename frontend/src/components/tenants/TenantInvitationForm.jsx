import { useState } from "react";
import { createTenantInvitation } from "../../api/platform.js";

export default function TenantInvitationForm({ tenantId, tenantStatus }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("tenant_admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading || tenantStatus !== "active") return;

    setLoading(true);
    setError("");
    setInvitation(null);

    try {
      const result = await createTenantInvitation(tenantId, {
        fullName,
        email,
        role,
      });

      setInvitation(result);
      setFullName("");
      setEmail("");
      setRole("tenant_admin");
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to create invitation."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card border-0 shadow-sm mt-4">
        <div className="card-body p-4">
            <h5 className='fw-semibold mb-2'>Invite Organization User</h5>

            <p className="text-secondary mb-4">
              Create a secure invitation for this organization.
              Invitations expire after 24 hours.
            </p>

            {tenantStatus != "active" && (
                <div className="alert alert-warning">
                    Invitations cannot be created while this 
                    organization is suspended. 
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label htmlFor="invite-name" className="form-label">
                            Full Name
                        </label>
                        <input
                        id="invite-name"
                        type="text"
                        className="form-control"
                        minLength={2}
                        maxLength={150}
                        required
                        disabled={loading || tenantStatus !== "active"}
                        value={fullName}
                        onChange={(event) =>
                          setFullName(event.target.value)
                        }
                        ></input>
                    </div>

                    <div className="col-md-6">
                        <label htmlFor="invite-email" className="form-label">
                            Email Address
                        </label>
                        <input 
                        id="invite-email"
                        type="email"
                        className="form-control"
                        required
                        disabled={loading || tenantStatus !== "active"}
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        ></input>
                    </div>

                    <div className="col-md-6">
                        <label htmlFor="invite-role" className="form-label">
                            Account Role
                        </label>
                        <select 
                        id="invite-role"
                        className="form-select"
                        disabled={loading || tenantStatus !== "active"}
                        value={role}
                        onChange={(event) => 
                            setRole(event.target.value)
                        }>
                            <option value="tenant_admin">Tenant Administrator</option>
                            <option value="fleet_manager">Fleet Manager</option>
                            <option value="driver">Driver</option>
                        </select>
                    </div>
                </div>

                {error &&(
                    <div className="alert alert-danger mt-3" role="alert">
                        {error}
                    </div>
                )}

                <button 
                type="submit"
                className="btn btn-success mt-4"
                disabled={loading || tenantStatus !== "active"}
                >
                    {loading ? "Creating Invitation..." : "Create Invitation"}
                </button>
            </form>

            {invitation && (
                <div className="alert alert-success mt-4" role="alert">
                    <h6 className="fw-bold">Invitation Email Submitted</h6>

                    <p className="mb-2">
                        Brevo accepted the invitation email for:
                        {" "}
                        <strong>{invitation.email}</strong>
                    </p>

                    <p className="mb-2">
                        Organization ID: {invitation.tenant_id}
                    </p>

                    <p className="mb-2">
                        Assigned role: {invitation.role}
                    </p>

                    <p className="mb-3">
                        Invitation expires:{" "}
                        {new Date(invitation.expires_at).toLocaleString()}
                    </p>

                    <p className="small mb-3">
                        The recipient should check their inbox and spam folder for the VoltRoute activation link.
                    </p>

                    <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    onClick={() => setInvitation(null)}
                    >
                        Dismiss
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}