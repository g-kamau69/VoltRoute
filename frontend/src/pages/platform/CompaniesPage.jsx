import {useEffect, useState} from "react";
import {Building2} from "lucide-react";
import {getPlatformTenants} from "../../api/platform.js";
import { Link } from "react-router-dom";

export default function CompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadCompanies() {
            try {
                const allCompanies = [];
                const limit = 100;
                let offset = 0;

                while (true) {
                    const page = await getPlatformTenants({limit, offset});

                    if (!Array.isArray(page)) {
                        throw new Error("Unexpected API response");
                    }

                    allCompanies.push(...page);

                    if (page.length < limit) break;

                    offset += page.length;
                }

                if (!cancelled) {
                    setCompanies(allCompanies);
                }
            } catch {
                if (!cancelled) {
                    setError("Unable to load registered companies.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadCompanies();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div>
            <div className="vr-page-heading">
                <div>
                    <h1>Companies</h1>
                    <p>View organizations registered on VoltRoute.</p>
                </div>
            </div>

            <div className="card border-0 shadow-sm mt-4">
                <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-2 mb-4">
                        <Building2 size={22} />
                        <h5 className="mb-0">Registered Organizations</h5>
                        {!loading && !error && (
                            <span className="badge text-bg-light border ms-auto">
                                {companies.length} companies
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <p className="text-secondary">Loading companies...</p>
                    ) : error ? (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    ) : companies.length === 0 ? (
                        <p className="text-secondary">
                            No registered companies found.
                        </p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Company Name</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.map((company) => (
                                        <tr key={company.id}>
                                            <td>{company.id}</td>
                                            <td className="fw-semibold">
                                                <Link
                                                    to={`/platform/companies/${company.id}`}
                                                    className="text-decoration-none text-success"
                                                >
                                                    {company.name}
                                                </Link>
                                            </td>
                                            <td>
                                                <span
                                                className={`badge ${
                                                    company.status === "active"
                                                        ? "text-bg-success"
                                                        : "text-bg-warning"
                                                        }`}
                                                >
                                                    {company.status}
                                                </span>
                                            </td>
                                            <td>
                                                {company.created_at
                                                    ? new Date(company.created_at).toLocaleDateString()
                                                    : "-"}
                                            </td>
                                            <td className="text-end">
                                                <Link
                                                    to={`/platform/companies/${company.id}`}
                                                    className="btn btn-sm btn-outline-success"
                                                >
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}