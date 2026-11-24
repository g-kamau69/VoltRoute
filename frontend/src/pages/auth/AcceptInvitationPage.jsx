import { useState } from "react";
import { Link } from "react-router-dom";
import { acceptTenantInvitation } from "../../api/auth.js";

export default function AcceptInvitationPage() {
    const [token, setToken] = useState(() => {
        const fragment = window.location.hash.slice(1);
        return new URLSearchParams(fragment).get("token") || "";
    });

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 12 || password.length > 128) {
            setError("Password must be between 12-128 characters.");
            return;
        }

        setLoading(true);

        try{
            const result = await acceptTenantInvitation(token, password);

            setSuccess(result);
            setToken("");   
            setPassword("");
            setConfirmPassword("");

            // Remove the invitation token from the address bar.
            window.history.replaceState(
                null,
                "",
                window.location.pathname
            );
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(
                typeof detail === "string"
                    ? detail
                    : "Unable to accept invitation. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
            <div className="card border-0 shadow-sm w-100" style={{maxWidth: 480}}>
                <div className="card-body p-4 p-md-5">
                    <h1 className="h3 fw-bold mb-2">
                        Welcome to VoltRoute
                    </h1>

                    <p className="text-secondary mb-4">
                        Activate your organization account.
                    </p>

                    {success ? (
                        <div>
                            <div className="alert alert-success" role='status'>
                                Your account has been activated. You can now sign in.
                            </div>

                            <p>
                                Organization ID: {" "}
                                <strong>{success.tenant_id}</strong>
                            </p>

                            <p>
                                Assigned Role: {" "}
                                <strong>{success.role}</strong>
                            </p>

                            <p className="text-secondary small">
                                Use your Organization ID, email address and new password to sign in.
                            </p>

                            <Link
                                to={`/login?tenant_id=${success.tenant_id}`}
                                className="btn btn-success w-100">
                                    Continue to Sign In
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="invitation-token" className="form-label">
                                    Invitation Token
                                </label>

                                <input
                                id="invitation-token"
                                type="password"
                                className="form-control"
                                placeholder="Enter or pasteyour invitation token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                required
                                minLength={32}
                                maxLength={256}
                                autoComplete="off"
                                ></input>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="new-password" className="form-label">
                                    Create Password
                                </label>

                                <input
                                id="new-password"
                                type="password"
                                className="form-control"
                                minLength={12}
                                maxLength={128}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                />

                                <small className="text-secondary">
                                    Use at least 12 characters.
                                </small>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="confirm-password" className="form-label">
                                    Confirm Password
                                </label>

                                <input
                                    id="confirm-password"
                                    type="password"
                                    className="form-control"
                                    minLength={12}
                                    maxLength={128}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>

                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <button type="submit" className="btn btn-success w-100" disabled={loading}>
                                {loading ? "Activating..." : "Activate Account"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}