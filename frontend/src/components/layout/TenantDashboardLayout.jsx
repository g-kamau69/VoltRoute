import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";

import {
  Menu,
  X,
  Bell,
  MessagesSquare,
  LogOut,
  Building2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";

import {
  getTenantNavigation,
  tenantRoleLabels,
  tenantHomePaths,
} from "../../config/tenantNavigation";

import voltRouteLogo from "../../assets/logo.png";
import useWorkspaceTheme from "../../hooks/useWorkspaceTheme";
import useSidebarResize from "../../hooks/useSidebarResize";

import "./TenantDashboardLayout.css";

function getInitials(fullName){
    if (!fullName){
        return "VR";
    }
    return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join("");
}

export default function TenantDashboardLayout({
    children,
    session,
    onLogout,
}){
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { theme, toggleTheme, isDark } = useWorkspaceTheme();
    const {
            sidebarWidth,
            isResizing,
            minWidth,
            maxWidth,
            startResize,
            moveResize,
            stopResize,
            resetWidth,
            handleResizeKeyDown,
            } = useSidebarResize();
    const user = session?.user;
    const role = user?.role;

    const basePath = tenantHomePaths[role];
    const roleLabel = tenantRoleLabels[role];
    const navigation = getTenantNavigation(role);

    const fullName = 
        user?.full_name?.trim() || "VoltRoute User";

    const companyName = 
     user?.tenant_name.trim() ||
     "Company Workspace";

    const initials = getInitials(fullName);

    const currentItem = navigation
        .flatMap((group) => group.items)
        .filter(
            (item) =>
                location.pathname === item.path ||
                (
                    item.path !== basePath &&
                    location.pathname.startsWith(`${item.path}/`)
                )
        )
        .sort((a, b) => b.path.length - a.path.length)[0];
    
        const currentPage = currentItem?.label || "Workspace";

        if (!basePath) {
            return <p>Unauthorized Workspace.</p>;
        }

        return (
           <div
                data-theme={theme}
                data-bs-theme={theme}
                style={{
                    "--vrt-sidebar-width": `${sidebarWidth}px`,
                }}
                className={[
                    "vrt-layout",
                    sidebarCollapsed ? "vrt-collapsed" : "",
                    isResizing ? "vrt-resizing" : "",
                ].join(" ")}>
                {/* sidebar */}

                <aside className={[
                    "vrt-sidebar",
                    sidebarOpen ? "vrt-sidebar-open" : "",
                ].join(" ")}>

                    {/* Brand */}
                    <div className="vrt-brand">
                        <Link to={basePath} className="vrt-brand-link" onClick={() => setSidebarOpen(false)}>
                            <img src={voltRouteLogo} alt="VoltRoute Logo" className="vrt-brand-logo" />

                            <span className="vrt-brand-tagline">
                                Fleet Intelligence
                            </span>
                        </Link>

                        <button type="button" className="vrt-mobile-close" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}>
                            <X size={22} />
                        </button>
                    </div>

                    {/* Company Information */}

                    <div className="vrt-company">
                        <div className="vrt-company-icon">
                            <Building2 size={20} />
                        </div>

                        <div className="vrt-company-details">
                            <strong title={companyName}>
                                {companyName}
                            </strong>

                            <span>{roleLabel}</span>
                        </div>
                    </div>

                    {/* Navigation Groups */}

                    <nav className="vrt-navigation" aria-label="Tenant navigation">
                        {navigation.map((group) => (
                            <section key={group.label} className="vrt-navigation-group">
                                <div className="vrt-navigation-label">
                                    {group.label}
                                </div>

                                <div className="vrt-navigation-items">
                                    {group.items.map((item) => {
                                        const ItemIcon = item.icon;

                                        return (
                                            <NavLink
                                            key={item.path}
                                            to={item.path}
                                            end={item.path === basePath}
                                            title={item.label}
                                            onClick={() => setSidebarOpen(false)}
                                            className={({isActive}) => 
                                            [
                                                "vrt-navigation-item",
                                                isActive ? "vrt-active" : "",
                                            ].join(" ")
                                            }
                                            >
                                                <ItemIcon size={19} strokeWidth={1.8} aria-hidden="true" className="vrt-navigation-icon" />

                                                <span className="vrt-navigation-text">
                                                    {item.label}
                                                </span>
                                            
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </nav>

                    {/* Sidebar footer */}
                    <div className="vrt-sidebar-footer">
                        <div className="vrt-user-avatar">
                            {initials}
                        </div>

                        <div className="vrt-user-details">
                            <strong title={fullName}>
                                {fullName}
                            </strong>

                            <span>{roleLabel}</span>
                        </div>

                        <button
                        type="button"
                        className="vrt-logout-button"
                        title="Sign Out"
                        onClick={onLogout}>
                            <LogOut size={19}/>
                        </button>
                    </div>
                </aside>

                {/* Desktop Sidebar Resize Handle */}

                {!sidebarCollapsed && (
                <div
                    className={[
                    "vrt-sidebar-resize-handle",
                    isResizing ? "vrt-resize-active" : "",
                    ].join(" ")}
                    role="separator"
                    aria-label="Resize sidebar"
                    aria-orientation="vertical"
                    aria-valuemin={minWidth}
                    aria-valuemax={maxWidth}
                    aria-valuenow={sidebarWidth}
                    aria-valuetext={`${sidebarWidth} pixels`}
                    tabIndex={0}
                    title="Drag to resize. Double-click to reset."
                    onPointerDown={startResize}
                    onPointerMove={moveResize}
                    onPointerUp={stopResize}
                    onPointerCancel={stopResize}
                    onLostPointerCapture={stopResize}
                    onDoubleClick={resetWidth}
                    onKeyDown={handleResizeKeyDown}
                >
                    <span className="vrt-resize-line" />

                    <span
                    className="vrt-resize-grip"
                    aria-hidden="true"
                    >
                    <span />
                    <span />
                    <span />
                    </span>
                </div>
                )}  

                {/* Mobile Overlay */}

                {sidebarOpen && (
                    <button
                    type="button"
                    className="vrt-sidebar-overlay"
                    aria-label="Close navigation"
                    onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Workspace */}

                <div className="vrt-main">
                    {/* Top navigation bar */}

                    <header className="vrt-topbar">
                        <div className="vrt-topbar-left">
                            <button
                                type="button"
                                className="vrt-menu-button vrt-mobile-menu"
                                aria-label="Open navigation"
                                aria-expanded={sidebarOpen}
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu size={22} />
                                
                            </button>

                            <button 
                            type="button"
                            className="vrt-menu-button vrt-desktop-toggle"
                            aria-label={
                                sidebarCollapsed
                                ? "Expand sidebar"
                                : "Collapse sidebar"
                            }
                            aria-expanded={!sidebarCollapsed}
                            onClick={() =>
                                setSidebarCollapsed((previous) => !previous)
                            }
                            >
                                {sidebarCollapsed ? (
                                    <ChevronRight size={21} />
                                ) : (
                                    <ChevronLeft size={21} />
                                )}
                            </button>

                            <div className="vrt-breadcrumb">
                                <span>Workspace</span>

                                <ChevronRight
                                size={15}
                                aria-hidden="true"
                                />

                                <strong>{currentPage}</strong>
                            </div>
                        </div>

                        <div className="vrt-topbar-right">
                            <button
                                type="button"
                                className="vrt-topbar-icon vrt-theme-toggle"
                                onClick={toggleTheme}
                                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                                aria-pressed={isDark}
                            >
                                {isDark ? (
                                    <Sun size={21} strokeWidth={1.8} />
                                ) : (
                                    <Moon size={21} strokeWidth={1.8} />
                                )}
                            </button>
                            <Link
                            to={`${basePath}/messages`}
                            className="vrt-topbar-icon"
                            title="Messages"
                            aria-label="Messages"
                            >
                                <MessagesSquare size={21} />
                            </Link>

                            <Link
                            to={`${basePath}/notifications`}
                            className="vrt-topbar-icon"
                            title="Notifications"
                            aria-label="Notifications"
                            >
                                <Bell size={21} />
                            </Link>

                            <div className="vrt-topbar-divider"></div>

                            <div className="vrt-profile">
                                <div className="vrt-profile-avatar">
                                    {initials}
                                </div>

                                <div className="vrt-profile-details">
                                    <strong title={fullName}>
                                        {fullName}
                                    </strong>

                                    <span>{roleLabel}</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}

                    <main className="vrt-content">
                        {children}
                    </main>

                    {/* Footer */}

                    <footer className="vrt-footer">
                        <span>
                            &copy; {new Date().getFullYear()} VoltRoute. All rights reserved.
                        </span>

                        <span>
                            Smart EV Fleet Management
                        </span>
                    </footer>
                </div>


            </div>
        );
}