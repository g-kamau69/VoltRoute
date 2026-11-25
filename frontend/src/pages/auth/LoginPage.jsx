import { useState } from "react";

import {
  ArrowRight,
  Building2,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  LoaderCircle,
  AlertCircle,
  Sun,
  Moon,
} from "lucide-react";

import {
  authenticatePlatform,
  authenticateTenant,
} from "../../api/auth.js";

import useWorkspaceTheme from "../../hooks/useWorkspaceTheme";

import LoginIntelligence from "../../components/auth/LoginIntelligence";

import voltRouteLogo from "../../assets/logo.png";

import "./LoginPage.css";


export default function LoginPage({ onLogin }) {

  const { theme, toggleTheme, isDark } =
    useWorkspaceTheme();

  const [accountType, setAccountType] =
    useState("tenant");

  const [tenantId, setTenantId] =
    useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");


  function changeAccountType(type) {
    setAccountType(type);
    setError("");
    setPassword("");
    setShowPassword(false);
  }


  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const organizationId = Number(tenantId);

    if (
      accountType === "tenant" &&
      (
        !Number.isSafeInteger(organizationId) ||
        organizationId <= 0
      )
    ) {
      setError("Enter a valid organization ID.");
      return;
    }

    setLoading(true);

    try {

      const session =
        accountType === "platform"
          ? await authenticatePlatform(
              email.trim(),
              password
            )
          : await authenticateTenant(
              organizationId,
              email.trim(),
              password
            );

      onLogin(session);

    } catch (requestError) {

      const detail =
        requestError.response?.data?.detail;

      const status =
        requestError.response?.status;

      if (status === 401) {

        setError(
          "Incorrect sign-in credentials. Please check your details."
        );

      } else if (typeof detail === "string") {

        setError(detail);

      } else if (status === 422) {

        setError(
          "Please check the information you entered."
        );

      } else if (!requestError.response) {

        setError(
          "Unable to connect to VoltRoute. Please check your connection."
        );

      } else {

        setError(
          "Unable to sign in. Please try again."
        );

      }

    } finally {
      setLoading(false);
    }
  }


  return (
    <main
      className="vrl-login-page"
      data-theme={theme}
    >

      {/* Authentication panel */}

      <section
        className="vrl-auth-panel"
        aria-label="VoltRoute sign in"
      >

        {/* Header */}

        <header className="vrl-header">

          <div className="vrl-brand">

            <img
              src={voltRouteLogo}
              alt="VoltRoute"
              className="vrl-logo"
            />

          </div>

          <button
            type="button"
            className="vrl-theme-button"
            onClick={toggleTheme}
            title={
              isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            aria-label={
              isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {isDark
              ? <Sun size={21} />
              : <Moon size={21} />}
          </button>

        </header>


        {/* Login form */}

        <div className="vrl-form-wrapper">

          <div className="vrl-welcome">

            <span className="vrl-eyebrow">
              Fleet Intelligence
            </span>

            <h1>Welcome back.</h1>

            <p>
              Sign in to your workspace to manage
              your electric fleet operations.
            </p>

          </div>


          {/* Account type selector */}

          <div
            className="vrl-account-switch"
            role="group"
            aria-label="Account type"
          >

            <button
              type="button"
              className={
                accountType === "tenant"
                  ? "vrl-account-active"
                  : ""
              }
              aria-pressed={accountType === "tenant"}
              disabled={loading}
              onClick={() =>
                changeAccountType("tenant")
              }
            >
              <Building2 size={16} />
              Organization
            </button>

            <button
              type="button"
              className={
                accountType === "platform"
                  ? "vrl-account-active"
                  : ""
              }
              aria-pressed={accountType === "platform"}
              disabled={loading}
              onClick={() =>
                changeAccountType("platform")
              }
            >
              <ShieldCheck size={16} />
              Platform Admin
            </button>

          </div>


          {/* Authentication errors */}

          {error && (
            <div className="vrl-error" role="alert">

              <AlertCircle size={19} />

              <span>{error}</span>

            </div>
          )}


          <form
            className="vrl-form"
            onSubmit={handleSubmit}
            aria-busy={loading}
          >

            {/* Organization identifier */}

            {accountType === "tenant" && (

              <div className="vrl-field">

                <label htmlFor="vrl-tenant-id">
                  Organization ID
                </label>

                <div className="vrl-input-wrapper">

                  <Building2 size={18} />

                  <input
                    id="vrl-tenant-id"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]+"
                    placeholder="Enter organization ID"
                    value={tenantId}
                    onChange={(event) =>
                      setTenantId(event.target.value)
                    }
                    required
                    disabled={loading}
                  />

                </div>

                <small className="vrl-field-help">
                  Your assigned organization identifier.
                </small>

              </div>

            )}


            {/* Email */}

            <div className="vrl-field">

              <label htmlFor="vrl-email">
                Work email
              </label>

              <div className="vrl-input-wrapper">

                <Mail size={18} />

                <input
                  id="vrl-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  autoComplete="username"
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  disabled={loading}
                />

              </div>

            </div>


            {/* Password */}

            <div className="vrl-field">

              <label htmlFor="vrl-password">
                Password
              </label>

              <div className="vrl-input-wrapper">

                <LockKeyhole size={18} />

                <input
                  id="vrl-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="vrl-password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={loading}
                >
                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />}
                </button>

              </div>

            </div>


            {/* Submit */}

            <button
              type="submit"
              className="vrl-submit"
              disabled={loading}
            >

              {loading ? (
                <>
                  <LoaderCircle
                    size={20}
                    className="vrl-spinner"
                  />

                  Signing in...
                </>
              ) : (
                <>
                  Sign in to workspace

                  <ArrowRight size={19} />
                </>
              )}

            </button>

          </form>


          <div className="vrl-security-note">

            <ShieldCheck size={16} />

            <span>
              Access restricted to authorized accounts.
            </span>

          </div>

          <div className="vrl-help">

            Need workspace access?

            <span>
              Contact your organization administrator.
            </span>

          </div>

        </div>


        {/* Footer */}

        <footer className="vrl-footer">

          <span>
            © {new Date().getFullYear()} VoltRoute
          </span>

          <span>
            Electric Fleet Intelligence
          </span>

        </footer>

      </section>


      {/* Intelligence map panel */}

      <LoginIntelligence />

    </main>
  );
}