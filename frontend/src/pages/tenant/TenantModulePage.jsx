import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TenantModulePage({
  title,
  icon: ModuleIcon,
  basePath,
}) {
  return (
    <div className="vto-page">

      <div className="vto-heading">

        <div>
          <div className="vto-eyebrow">
            VoltRoute Workspace
          </div>

          <h1>{title}</h1>

          <p>
            Manage and monitor {title.toLowerCase()}.
          </p>
        </div>

      </div>

      <section className="vto-panel">

        <div className="vto-empty-map">

          <div className="vto-empty-icon">
            {ModuleIcon && <ModuleIcon size={32} />}
          </div>

          <h3>{title}</h3>

          <p>
            This module is awaiting implementation.
            Its functionality will be connected during
            the corresponding development phase.
          </p>

          <Link
            to={basePath}
            className="vto-primary-button"
            style={{ marginTop: "20px" }}
          >
            <ArrowLeft size={16} />
            Back to Overview
          </Link>

        </div>

      </section>

    </div>
  );
}
