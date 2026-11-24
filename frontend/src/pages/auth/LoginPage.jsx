
import { use, useState } from "react";
import { authenticatePlatform, authenticateTenant } from "../../api/auth.js";
import { useSearchParams } from "react-router-dom";

export default function LoginPage ({ onLogin }) {
    const [searchParams] = useSearchParams();
    const invitedTenantId = searchParams.get("tenant_id");
    const [accountType, setAccountType] = useState("tenant");
    const [tenantId, setTenantId] = useState(
        invitedTenantId && /^[1-9]\d*$/.test(invitedTenantId)
            ? invitedTenantId
            : ""
        );
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const session =
                accountType === "platform"
                    ? await authenticatePlatform(email, password)
                    : await authenticateTenant(tenantId, email, password);

            onLogin(session);
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(
                typeof detail === "string"
                    ? detail
                    : "Unable to sign in. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
            <div className="card border-0 shadow-sm w-100" style={{maxWidth: 440}}>
                <div className="card-body p-4 p-md-5">
                    <h1 className="h3 fw-bold mb-1">VoltRoute</h1>
                    <p className="text-secondary mb-4">Sign In to your workspace</p>

                    <div className="btn-group w-100 mb-4" role="group" aria-label="Account type">
                        <button 
                        type="button"
                        className={`btn ${
                            accountType === "tenant" ? "btn-success" : "btn-outline-secondary"
                        }`}
                        onClick={() => {
                            setAccountType("tenant");
                            setError("");
                        }}
                        >
                            Organization
                        </button>
                        <button 
                        type="button"
                        className={`btn ${
                            accountType === "platform" ? "btn-success" : "btn-outline-secondary"
                        }`}
                        onClick={() => {
                            setAccountType("platform");
                            setError("");
                        }}>
                            Platform Admin
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {accountType === "tenant" && (
                            <div className="mb-3">
                                <label htmlFor="tenantId" className="form-label">
                                    Organization ID
                                </label>
                                <input 
                                id="tenantId"
                                type="number"
                                min="1"
                                required
                                className="form-control"
                                value={tenantId}
                                onChange={(event) => setTenantId(event.target.value)}
                                placeholder="Enter your organization ID"
                                />
                            </div>
                        )}

                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">
                                Email address
                            </label>
                            <input
                            id="email"
                            type="email"
                            required
                            autoComplete="username"
                            className="form-control"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="form-label">
                                Password
                            </label>
                            <input
                            id="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            className="form-control"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter your password"
                            />
                        </div>
                        
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        <button 
                        type="submit"
                        className="btn btn-success w-100 py-2"
                        disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}