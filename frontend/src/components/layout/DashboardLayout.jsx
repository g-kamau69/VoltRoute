import { useState } from "react";
import "./DashboardLayout.css";
import voltRouteLogo from "../../assets/logo.png";
import { NavLink } from "react-router-dom";
import {
  getNavigationForRole,
  platformNavigationGroups,
} from "../../config/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Bike,
  BatteryCharging,
  Route,
  Play,
  Bell,
  ChartNoAxesCombined,
  Activity,
  ScrollText,
  Settings,
  Icon,
} from "lucide-react";
export default function DashboardLayout({
    children,
    role = "tenant_admin",
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigation = getNavigationForRole(role);

  return (
    <div className="vr-layout">
        <aside className={`vr-sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="vr-brand">
                <img
                    src={voltRouteLogo}
                    alt="VoltRoute Logo"
                    className="vr-brand-logo"
                />

                <small className="vr-brand-tagline">
                    Fleet Intelligence
                </small>
            </div>
            <div className="vr-sidebar-scroll">
                <div className="vr-sidebar-label">WORKSPACE</div>

                
                <nav className="vr-navigation" aria-label="Main navigation">
                {["super_admin", "platform_admin"].includes(role)
                    ? platformNavigationGroups.map((group) => {
                        const GroupIcon = group.icon;

                        if (group.children) {
                        return (
                            <details key={group.label} className="vr-nav-group">
                            <summary className="vr-nav-group-heading">
                                <GroupIcon size={19} strokeWidth={1.8} />

                                <span>{group.label}</span>

                                <span className="vr-nav-chevron">⌄</span>
                            </summary>

                            <div className="vr-nav-submenu">
                                {group.children.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                    `vr-nav-subitem ${isActive ? "active" : ""}`
                                    }
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    {item.label}
                                </NavLink>
                                ))}
                            </div>
                            </details>
                        );
                        }

                        return (
                        <NavLink
                            key={group.path}
                            to={group.path}
                            end
                            className={({ isActive }) =>
                            `vr-nav-item ${isActive ? "active" : ""}`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="vr-nav-icon">
                            <GroupIcon size={19} strokeWidth={1.8} />
                            </span>

                            <span>{group.label}</span>
                        </NavLink>
                        );
                    })
                    : navigation.map((item) => {
                        const ItemIcon = item.icon;

                        return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={["/tenant", "/fleet", "/driver"].includes(item.path)}
                            className={({ isActive }) =>
                            `vr-nav-item ${isActive ? "active" : ""}`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="vr-nav-icon">
                            {typeof ItemIcon === "string" ? (
                                ItemIcon
                            ) : (
                                <ItemIcon size={19} strokeWidth={1.8} />
                            )}
                            </span>

                            <span>{item.label}</span>
                        </NavLink>
                        );
                    })}
                </nav>
            </div>


                <div className="vr-sidebar-footer">
                    <div className="vr-avatar">VR</div>
                    <div>
                        <strong>VoltRoute Workspace</strong>
                        <small>Dashboard preview</small>
                    </div>
                </div>
        </aside>

        {sidebarOpen && (
            <button 
            type="button"
            className="vr-sidebar-overlay"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            ></button>
        )}

        <div className="vr-main">
            <header className="vr-topbar">
                <button
                type="button"
                className="vr-menu-toggle"
                aria-label="Open navigation"
                onClick={() => setSidebarOpen(true)}
                >
                    <span className="vr-icon">☰</span>
                </button>

                <div className="vr-breadcrumb">
                    Workspace <span>/</span> Overview
                </div>

                <div className="vr-topbar-right">
                    <span className="vr-environment">Development</span>
                    <div className="vr-user-avatar">VR</div>
                </div>
            </header>

            <main className="vr-content"> {children} </main>
        </div>
    </div>
  );
}