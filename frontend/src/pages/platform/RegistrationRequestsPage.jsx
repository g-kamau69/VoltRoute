
import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";

import {
  getRegistrationRequestsByStatus,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  getRegistrationChecks,
} from "../../api/platform.js";

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_BADGES = {
  pending: "text-bg-warning",
  approved: "text-bg-success",
  rejected: "text-bg-danger",
};

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || "Validation error")
      .join("; ");
  }

  return error.message || fallback;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

export default function RegistrationRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [activeStatus, setActiveStatus] = useState("pending");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [decisionError, setDecisionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);
  const [verification, setVerification] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  useEffect(() => {
    let active = true;

    async function fetchRequests() {
      setLoading(true);
      setError("");

      try {
        const data = await getRegistrationRequestsByStatus(
          activeStatus
        );

        if (active) {
          setRequests(data);
        }
      } catch (err) {
        console.error("Registration API error:", err);

        if (active) {
          setRequests([]);
          setError(
            getErrorMessage(
              err,
              "Unable to load registration requests."
            )
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchRequests();

    return () => {
      active = false;
    };
  }, [activeStatus, refreshKey]);

  function refreshRequests() {
    setRefreshKey((previous) => previous + 1);
  }

  function changeStatus(status) {
    if (submitting || status === activeStatus) return;

    setActiveStatus(status);
    setRequests([]);
    setSelectedRequest(null);
    setReviewNotes("");
    setDecisionError("");
    setSuccessMessage("");
  }

  async function openReview(request){
    setSelectedRequest(request);
    setReviewNotes("");
    setDecisionError("");
    setVerification(null);
    setVerificationError("");
    setVerificationLoading(true);

    try{
        const result = await getRegistrationChecks(request.id);
        
        setVerification(result);
    } catch (error){
        console.error("Verification checks failed:", error);

        setVerificationError(
            "Unable to load preliminary verification results."
        );
    } finally{
        setVerificationLoading(false);
    }
  }

  function closeReview() {
    if (submitting) return;

    setSelectedRequest(null);
    setReviewNotes("");
    setDecisionError("");
  }

  async function handleDecision(action) {
    if (
      !selectedRequest ||
      selectedRequest.status !== "pending" ||
      submitting
    ) {
      return;
    }

    const requestId = selectedRequest.id;
    const organizationName = selectedRequest.organization_name;

    const verb = action === "approve" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${verb} ${organizationName}?`
    );

    if (!confirmed) return;

    setSubmitting(true);
    setDecisionError("");
    setSuccessMessage("");

    try {
      if (action === "approve") {
        await approveRegistrationRequest(
          requestId,
          reviewNotes.trim()
        );
      } else {
        await rejectRegistrationRequest(
          requestId,
          reviewNotes.trim()
        );
      }

      setSuccessMessage(
        `${organizationName} was successfully ${
          action === "approve" ? "approved" : "rejected"
        }.`
      );

      closeReviewAfterDecision();
      refreshRequests();
    } catch (err) {
      console.error("Registration decision error:", err);

      const message = getErrorMessage(
        err,
        `Unable to ${verb} this application.`
      );

      const alreadyReviewed =
        err.response?.status === 422 &&
        message.toLowerCase().includes("already");

      if (alreadyReviewed) {
        setSelectedRequest(null);
        setReviewNotes("");
        setDecisionError("");
        setError(message);
      } else {
        setDecisionError(message);
      }

      refreshRequests();
    } finally {
      setSubmitting(false);
    }
  }

  function closeReviewAfterDecision() {
    setSelectedRequest(null);
    setReviewNotes("");
    setDecisionError("");
  }

  const isPending = selectedRequest?.status === "pending";

  const activeLabel =
    STATUS_TABS.find((tab) => tab.value === activeStatus)
      ?.label || "Registration";

  return (
    <div>
      {/* Page heading */}
      <div className="vr-page-heading">
        <div>
          <h1>Registration Requests</h1>
          <p>
            Review organizations requesting access to VoltRoute.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-success d-flex align-items-center gap-2"
          onClick={refreshRequests}
          disabled={loading || submitting}
        >
          <RefreshCw size={18} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Decision success */}
      {successMessage && (
        <div
          className="alert alert-success alert-dismissible mt-4"
          role="status"
        >
          {successMessage}

          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss"
            onClick={() => setSuccessMessage("")}
          />
        </div>
      )}

      {/* Status tabs */}
      <div className="d-flex flex-wrap gap-2 mt-4 mb-3">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={
              activeStatus === tab.value
                ? "btn btn-success"
                : "btn btn-outline-secondary"
            }
            onClick={() => changeStatus(tab.value)}
            disabled={submitting}
            aria-pressed={activeStatus === tab.value}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications table */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-2 mb-4">
            <ClipboardList
              size={23}
              className="text-success"
            />

            <h5 className="mb-0">
              {activeLabel} Applications
            </h5>

            {!loading && !error && (
              <span
                className={`badge ms-auto ${
                  STATUS_BADGES[activeStatus]
                }`}
              >
                {requests.length} {activeStatus}
              </span>
            )}
          </div>

          {loading ? (
            <p className="text-secondary mb-0">
              Loading registration requests...
            </p>
          ) : error ? (
            <div
              className="alert alert-danger mb-0"
              role="alert"
            >
              {error}

              <button
                type="button"
                className="btn btn-sm btn-outline-danger ms-3"
                onClick={refreshRequests}
              >
                Retry
              </button>
            </div>
          ) : requests.length === 0 ? (
            <div className="alert alert-info mb-0">
              No {activeStatus} organization applications.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Organization</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.id}</td>

                      <td className="fw-semibold">
                        {request.organization_name}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            STATUS_BADGES[request.status] ||
                            "text-bg-secondary"
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>

                      <td>
                        {formatDate(request.created_at)}
                      </td>

                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => openReview(request)}
                          disabled={submitting}
                        >
                          {request.status === "pending"
                            ? "Review Application"
                            : "View Decision"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Application Review Modal */}
      {selectedRequest && (
        <div
          className="modal d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="registrationReviewTitle"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.55)",
          }}
          onMouseDown={(event) => {
            if (
              !submitting &&
              event.target === event.currentTarget
            ) {
              closeReview();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !submitting) {
              closeReview();
            }
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              {/* Modal header */}
              <div className="modal-header">
                <h5
                  className="modal-title"
                  id="registrationReviewTitle"
                >
                  {isPending
                    ? "Review Organization Application"
                    : "Application Decision History"}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeReview}
                  disabled={submitting}
                />
              </div>

              {/* Modal body */}
              <div className="modal-body p-4">
                <div className="mb-4">
                  <h5 className="fw-bold mb-1">
                    {selectedRequest.organization_name}
                  </h5>

                  <p className="text-secondary mb-0">
                    Application #{selectedRequest.id}
                  </p>
                </div>

                {/* Organization Information */}
                <h6 className="fw-bold text-success mb-3">
                  Organization Information
                </h6>

                <dl className="row">
                  <dt className="col-sm-4">
                    Organization Name
                  </dt>
                  <dd className="col-sm-8">
                    {selectedRequest.organization_name}
                  </dd>

                  <dt className="col-sm-4">
                    Application ID
                  </dt>
                  <dd className="col-sm-8">
                    {selectedRequest.id}
                  </dd>

                  <dt className="col-sm-4">
                    Submitted
                  </dt>
                  <dd className="col-sm-8">
                    {formatDate(selectedRequest.created_at)}
                  </dd>

                  <dt className="col-sm-4">
                    Status
                  </dt>
                  <dd className="col-sm-8">
                    <span
                      className={`badge ${
                        STATUS_BADGES[selectedRequest.status] ||
                        "text-bg-secondary"
                      }`}
                    >
                      {selectedRequest.status}
                    </span>
                  </dd>
                </dl>

                <hr className="my-4" />

                {/* Contact Details */}
                <h6 className="fw-bold text-success mb-3">
                  Applicant Contact Details
                </h6>

                <dl className="row">
                  <dt className="col-sm-4">
                    Contact Person
                  </dt>
                  <dd className="col-sm-8">
                    {selectedRequest.contact_name ||
                      "Not provided"}
                  </dd>

                  <dt className="col-sm-4">
                    Email Address
                  </dt>
                  <dd className="col-sm-8">
                    {selectedRequest.contact_email ||
                      "Not provided"}
                  </dd>

                  <dt className="col-sm-4">
                    Phone Number
                  </dt>
                  <dd className="col-sm-8">
                    {selectedRequest.contact_phone ||
                      "Not provided"}
                  </dd>
                </dl>

                <hr className="my-4" />

                <h6 className="fw-bold text-success mb-3"> 
                    Preliminary Verification Checks
                </h6>
                {verificationLoading ? (
                    <p className="text-secondary">
                        Running Preliminary checks...
                    </p>
                ) : verificationError ? (
                    <div className="alert alert-warning" role="alert">
                        {verificationError}
                        </div>
                ) : verification ? (
                    <div>
                        <p className="small text-secondary mb-2">
                            {verification.total_checks - verification.total_issues}
                            /{verification.total_checks} preliminary checks passed
                        </p>

                        <div className="vr-check-stepper">
                            {verification.checks.map((check, index) => (
                                <div key={check.rule} className="vr-check-step">
                                <div
                                    className={`vr-check-circle ${
                                    check.passed ? "passed" : "failed"
                                    }`}
                                    title={check.message}
                                >
                                    {check.passed ? "✓" : "!"}
                                </div>

                                {index < verification.checks.length - 1 && (
                                    <div
                                    className={`vr-check-line ${
                                        check.passed ? "passed" : "failed"
                                    }`}
                                    />
                                )}

                                <div className="vr-check-label">
                                    <div className="vr-check-rule">{check.rule}</div>
                                </div>
                                </div>
                            ))}
</div>

                        <p className="small text-secondary mt-3 mb-0">
                            These checks assess application data quality and possible duplicates. They do not establish legal business verification.
                        </p>
                    </div>

                    ) : (
                        <p className="text-secondary">
                            No verification results available.
                        </p>
                    )}

                <hr className="my-4" />

                {/* Review History */}
                <h6 className="fw-bold text-success mb-3">
                  Application Review
                </h6>

                <dl className="row">
                  <dt className="col-sm-4">
                    Reviewed By
                  </dt>
                  <dd className="col-sm-8">
                    {selectedRequest.reviewed_by ??
                      "Not reviewed yet"}
                  </dd>

                  <dt className="col-sm-4">
                    Review Date
                  </dt>
                  <dd className="col-sm-8">
                    {selectedRequest.reviewed_at
                      ? formatDate(
                          selectedRequest.reviewed_at
                        )
                      : "Not reviewed yet"}
                  </dd>

                  <dt className="col-sm-4">
                    Review Notes
                  </dt>
                  <dd className="col-sm-8">
                    {selectedRequest.review_notes ||
                      "No review notes."}
                  </dd>
                </dl>

                {/* Decisions only for pending requests */}
                {isPending && (
                  <>
                    <hr className="my-4" />

                    <h6 className="fw-bold text-success mb-3">
                      Super Admin Decision
                    </h6>

                    <label
                      htmlFor="registrationReviewNotes"
                      className="form-label fw-semibold"
                    >
                      Review Notes
                    </label>

                    <textarea
                      id="registrationReviewNotes"
                      className="form-control"
                      rows={3}
                      maxLength={2000}
                      placeholder="Enter the reason for your decision..."
                      value={reviewNotes}
                      onChange={(event) =>
                        setReviewNotes(event.target.value)
                      }
                      disabled={submitting}
                    />

                    {decisionError && (
                      <div
                        className="alert alert-danger mt-3"
                        role="alert"
                      >
                        {decisionError}
                      </div>
                    )}

                    <div className="alert alert-info mt-3 mb-0">
                      Review the organization's information
                      before making an approval decision.
                      Formal verification results are not
                      included in this API response.
                    </div>
                  </>
                )}

                {!isPending && (
                  <div className="alert alert-secondary mt-3 mb-0">
                    This application has already been reviewed.
                    Its decision history is read-only.
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeReview}
                  disabled={submitting}
                >
                  Close
                </button>

                {isPending && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() =>
                        handleDecision("reject")
                      }
                      disabled={submitting}
                    >
                      Reject Application
                    </button>

                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() =>
                        handleDecision("approve")
                      }
                      disabled={submitting}
                    >
                      {submitting
                        ? "Processing..."
                        : "Approve Application"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
