import {
  LayoutDashboard,
  Building2,
  Play,
  Users,
  ChartNoAxesCombined,
  Bike,
  BatteryCharging,
  Route,
  PlayCircle,
  Bell,
  BarChart3,
  Activity,
  ScrollText,
  Settings,
} from "lucide-react";

export const roleNavigation = {
    super_admin: [
        { label: "Overview", path: "/platform", icon: LayoutDashboard },
        { label: "Companies", path: "/platform/companies", icon: Building2 },
        { label: "Users & Roles", path: "/platform/users", icon: Users },
        { label: "Global Fleet", path: "/platform/fleet", icon: Bike },
        { label: "Swap Stations", path: "/platform/stations", icon: BatteryCharging },
        { label: "Route Monitoring", path: "/platform/routes", icon: Route },
        { label: "Simulation Center", path: "/platform/simulation", icon: Play },
        { label: "Alerts", path: "/platform/alerts", icon: Bell },
        { label: "Reports & Analytics", path: "/platform/reports", icon: ChartNoAxesCombined },
        { label: "System Health", path: "/platform/health", icon: Activity },
        { label: "Audit Logs", path: "/platform/audit", icon: ScrollText },
        { label: "Settings", path: "/platform/settings", icon: Settings },
    ],

    platform_admin: [
        { label: "Overview", path: "/platform", icon: LayoutDashboard },
        { label: "Companies", path: "/platform/companies", icon: Building2 },
        { label: "Users & Roles", path: "/platform/users", icon: Users },
        { label: "Global Fleet", path: "/platform/fleet", icon: Bike },
        { label: "Swap Stations", path: "/platform/stations", icon: BatteryCharging },
        { label: "Route Monitoring", path: "/platform/routes", icon: Route },
        { label: "Simulation Center", path: "/platform/simulation", icon: Play },
        { label: "Alerts", path: "/platform/alerts", icon: Bell },
        { label: "Reports & Analytics", path: "/platform/reports", icon: ChartNoAxesCombined },
        { label: "System Health", path: "/platform/health", icon: Activity },
        { label: "Audit Logs", path: "/platform/audit", icon: ScrollText },
        { label: "Settings", path: "/platform/settings", icon: Settings },
    ],

    tenant_admin: [
        { label: "Overview", path: "/tenant", icon: LayoutDashboard },
        { label: "Vehicles", path: "/tenant/vehicles", icon: Bike },
        { label: "Staff", path: "/tenant/staff", icon: Users },
        { label: "Assignments", path: "/tenant/assignments", icon: Route },
        { label: "Settings", path: "/tenant/settings", icon: Settings },
    ],

    fleet_manager: [
        { label: "Overview", path: "/fleet", icon: LayoutDashboard },
        { label: "Live Tracking", path: "/fleet/tracking", icon: Activity },
        { label: "Vehicles", path: "/fleet/vehicles", icon: Bike },
        { label: "Assignments", path: "/fleet/assignments", icon: Route },
        { label: "Routes", path: "/fleet/routes", icon: Route },
        { label: "Swap Stations", path: "/fleet/stations", icon: BatteryCharging },
    ],

    driver: [
        { label: "Overview", path: "/driver", icon: LayoutDashboard },
        { label: "My Motorcycle", path: "/driver/vehicle", icon: Bike },
        { label: "My Trips", path: "/driver/trips", icon: Route },
        { label: "Swap Stations", path: "/driver/stations", icon: BatteryCharging },
    ],
};

export function getNavigationForRole(role) {
    return roleNavigation[role] ?? [];
}

export const platformNavigationGroups = [
    {
        label: "Overview",
        icon: LayoutDashboard,
        path: "/platform",
    },
    {
        label: "Organization Management",
        icon: Building2,
        children: [
            {
                label: "Companies",
                path: "/platform/companies",
            },
            {
                label: "Registration Requests",
                path: "/platform/registrations",
            },
            {
                label: "Verifications",
                path: "/platform/verifications",
            },
    ],
    },
    {
        label: "User Management",
        icon: Users,
        children: [
            {
                label: "Users& Roles",
                path: "/platform/users",
            },
        ],
    },
    {
        label: "Fleet Operations",
        icon: Bike,
        children: [
            {
                label: "Global Fleet",
                path: "/platfrom/fleet",
            },
            {
                label: "Swap Stations",
                path: "/platform/stations",
            },
            {
                label: "Route Monitoring",
                path: "/platform/routes",
            },
        ],
    },
    {
        label: "Simulation & Monitoring",
        icon: Activity,
        children: [
            {
                label: "Simulation Center",
                path: "/platform/simulation",
            },
            {
                label: "Alerts",
                path: "/platform/alerts",
            },
        ],
    },
    {
        label: "Reports & Security",
        icon: ChartNoAxesCombined,
        children: [
            {
                label: "Reports & Analytics",
                path: "/platform/reports",
            },
            {
                label: "Audit Logs",
                path: "/platform/audit",
            },
        ],
    },
    {
        label: "Settings",
        icon: Settings,
        path: "/platform/settings",
    },
];