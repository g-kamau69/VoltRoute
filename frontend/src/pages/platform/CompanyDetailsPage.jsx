
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import {
  getPlatformTenants,
  suspendCompany,
  reactivateCompany,
} from "../../api/platform.js";
import TenantInvitationForm from "../../components/tenants/TenantInvitationForm.jsx";   

function formatDate(value) {
  return value
    ? new Date(value).toLocaleString()
    : "Not available";
}

const companyTabs = [
  { id: "overview", label: "Overview" },
  { id: "fleet", label: "Fleet" },
  { id: "staff", label: "Staff" },
  { id: "activity", label: "Activity" },
  { id: "administration", label: "Administration" },
];

export default function CompanyDetailsPage({ userRole }) {
  const { companyId } = useParams();

  const [activeTab, setActiveTab] = useState("overview");
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");

    const isSuperAdmin = userRole === "super_admin";
    useEffect(() => {
        let cancelled = false;

    async function loadCompany() {
      setLoading(true);
      setError("");
      setCompany(null);

      try {
        const id = Number(companyId);

        if (!Number.isSafeInteger(id) || id <= 0) {
          throw new Error("Invalid company ID.");
        }

        let offset = 0;
        const limit = 100;
        let found = null;

        while (true) {
          const page = await getPlatformTenants({
            limit,
            offset,
          });

          if (!Array.isArray(page)) {
            throw new Error("Unexpected API response.");
          }

          found = page.find((item) => item.id === id);

          if (found || page.length < limit) {
            break;
          }

          offset += page.length;
        }

        if (!cancelled) {
          if (found) {
            setCompany(found);
          } else {
            setError("Company not found.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message === "Invalid company ID."
              ? err.message
              : "Unable to load company information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCompany();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

    async function handleStatusChange() {
        if (!company || !isSuperAdmin || actionLoading) return; 

        const suspending = company.status === "active";

        if (!suspending && company.status !== "suspended") return;

        const actionName = suspending ? "suspend" : "reactivate";

        const confirmed = window.confirm(
            `Are you sure you want to ${actionName} "${company.name}"?`
        );

        if (!confirmed) return;

        setActionLoading(true);
        setActionError("");
        setActionSuccess("");

        try{
            const updatedCompany = suspending
                ? await suspendCompany(company.id)
                : await reactivateCompany(company.id);

            setCompany(updatedCompany);

            setActionSuccess(
                `${updatedCompany.name} has been ${
                    suspending ? "suspended" : "reactivated"
                } successfully.`
            );
        } catch (err) {
            const detail = err.response?.data?.detail;

            setActionError(
                typeof detail === "string"
                    ? detail
                    : "Unable to update the organization status."
            );
        } finally {
            setActionLoading(false);
        }
    }
  return (
    <div>
      <Link
        to="/platform/companies"
        className="text-decoration-none d-inline-flex align-items-center gap-2 mb-4"
      >
        <ArrowLeft size={18} />
        Back to Companies
      </Link>

      {loading ? (
        <p>Loading company information...</p>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : company ? (
        <>
          {/* Company heading */}
          <div className="vr-page-heading">
            <div>
              <h1>{company.name}</h1>
              <p>Organization ID: {company.id}</p>
            </div>

            <span
              className={`badge ${
                company.status === "active"
                  ? "text-bg-success"
                  : "text-bg-warning"
              }`}
            >
              {company.status}
            </span>
          </div>

          {/* Company tabs */}
          <div className="border-bottom mt-4">
            <nav
              className="d-flex gap-2 flex-wrap pb-2"
              aria-label="Company sections"
            >
              {companyTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`btn ${
                    activeTab === tab.id
                      ? "btn-success"
                      : "btn-outline-secondary"
                  }`}
                  aria-pressed={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview tab */}
          {activeTab === "overview" && (
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <Building2
                    size={24}
                    className="text-success"
                  />
                  <h5 className="mb-0">
                    Organization Profile
                  </h5>
                </div>

                <div className="row g-4">
                  <div className="col-md-6">
                    <small className="text-secondary">
                      Company Name
                    </small>
                    <p className="fw-semibold mt-1">
                      {company.name}
                    </p>
                  </div>

                  <div className="col-md-6">
                    <small className="text-secondary">
                      Account Status
                    </small>
                    <p className="fw-semibold mt-1">
                      {company.status}
                    </p>
                  </div>

                  <div className="col-md-6">
                    <small className="text-secondary">
                      Registration Date
                    </small>
                    <p className="fw-semibold mt-1">
                      {formatDate(company.created_at)}
                    </p>
                  </div>

                  <div className="col-md-6">
                    <small className="text-secondary">
                      Approval Date
                    </small>
                    <p className="fw-semibold mt-1">
                      {formatDate(company.approved_at)}
                    </p>
                  </div>

                  <div className="col-md-6">
                    <small className="text-secondary">
                      Approved By (Admin ID)
                    </small>
                    <p className="fw-semibold mt-1">
                      {company.approved_by ?? "Not available"}
                    </p>
                  </div>

                  <div className="col-md-6">
                    <small className="text-secondary">
                      Last Updated
                    </small>
                    <p className="fw-semibold mt-1">
                      {formatDate(company.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fleet tab */}
          {activeTab === "fleet" && (
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body p-4">
                <h5 className="fw-semibold mb-3">
                  Fleet Overview
                </h5>

                <p className="text-secondary mb-0">
                  Vehicle statistics, battery levels,
                  vehicle status, and fleet activity for
                  this organization will appear here.
                </p>
              </div>
            </div>
          )}

          {/* Staff tab */}
          {activeTab === "staff" && (
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body p-4">
                <h5 className="fw-semibold mb-3">
                  Organization Staff
                </h5>

                <p className="text-secondary mb-0">
                  Tenant administrators, fleet managers,
                  drivers, and staff invitation information
                  will appear here.
                </p>
              </div>
            </div>
          )}

          {/* Activity tab */}
          {activeTab === "activity" && (
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body p-4">
                <h5 className="fw-semibold mb-3">
                  Organization Activity
                </h5>

                <p className="text-secondary mb-0">
                  Registration history, verification events,
                  and administrative audit activity
                  will appear here.
                </p>
              </div>
            </div>
          )}

          {/* Administration tab */}
          {activeTab === "administration" && (
            <>
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body p-4">
                <h5 className="fw-semibold mb-3">
                  Organization Administration
                </h5>

                <p className="text-secondary">
                    Manage the organization's access to VoltRoute.
                </p>

                <div className="d-flex align-items-center gap-3 flex-wrap mb-4">
                  <span className="fw-semibold">Current Status:</span>

                  <span
                    className={`badge ${
                      company.status === "active"
                        ? "text-bg-success"
                        : "text-bg-warning"
                    }`}
                  >
                    {company.status}
                  </span>
                </div>

                {actionError && (
                    <div className="alert alert-danger" role="alert">
                        {actionError}
                    </div>
                )}

                {actionSuccess && (
                    <div className="alert alert-success" role="status">
                        {actionSuccess}
                    </div>
                )}
                
                {isSuperAdmin ? (
                    <>
                        <p className="small text-secondary">
                            Suspending an organization prevents its users
                            from signing in until the account is reactivated.
                        </p>

                        {["active", "suspended"].includes(company.status) && (
                            <button
                                type="button"
                                className={`btn ${
                                    company.status === "active"
                                        ? "btn-outline-danger"
                                        : "btn-success"
                                }`}
                                disabled={actionLoading}
                                onClick={handleStatusChange}
                            >
                                {actionLoading
                                    ? "Processing..."
                                    : company.status === "active"
                                        ? "Suspend Organization"
                                        : "Reactivate Organization"}
                            </button>
                        )}
                    </>
                ) : (
                    <div className="alert alert-info mb-0">
                        Only Super Administrators can suspend or reactivate
                        organizations.
                    </div>
                )}
              </div>
            </div>
            {isSuperAdmin && (
                <TenantInvitationForm
                    tenantId={company.id}
                    tenantStatus={company.status}
                />
            )}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
