import {
  LayoutDashboard,
  Map,
  Package,
  Navigation,
  Route,
  Bike,
  Users,
  ClipboardList,
  Wrench,
  Zap,
  BatteryCharging,
  Plug,
  MessagesSquare,
  Megaphone,
  Bell,
  FlaskConical,
  ChartNoAxesCombined,
  Wallet,
  ShieldCheck,
  Settings,
  ScrollText,
} from "lucide-react";

const sharedGroups = [
  {
    label: "Workspace",
    items: [
      {
        label: "Overview",
        path: "",
        icon: LayoutDashboard,
      },
      {
        label: "Live Fleet",
        path: "tracking",
        icon: Map,
      },
      {
        label: "Orders",
        path: "orders",
        icon: Package,
      },
      {
        label: "Dispatch Center",
        path: "dispatch",
        icon: Navigation,
      },
      {
        label: "Trips & Routes",
        path: "routes",
        icon: Route,
      },
    ],
  },
  {
    label: "Fleet Management",
    items: [
      {
        label: "Vehicles",
        path: "vehicles",
        icon: Bike,
      },
      {
        label: "Drivers",
        path: "drivers",
        icon: Users,
      },
      {
        label: "Assignments",
        path: "assignments",
        icon: ClipboardList,
      },
      {
        label: "Maintenance",
        path: "maintenance",
        icon: Wrench,
      },
    ],
  },
  {
    label: "Energy Management",
    items: [
      {
        label: "Energy Intelligence",
        path: "energy",
        icon: Zap,
      },
      {
        label: "Battery Monitoring",
        path: "batteries",
        icon: BatteryCharging,
      },
      {
        label: "Charging & Swap",
        path: "stations",
        icon: Plug,
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        label: "Messages",
        path: "messages",
        icon: MessagesSquare,
      },
      {
        label: "Announcements",
        path: "announcements",
        icon: Megaphone,
      },
      {
        label: "Alerts & Notifications",
        path: "notifications",
        icon: Bell,
      },
    ],
  },
  {
    label: "Intelligence & Analytics",
    items: [
      {
        label: "Simulation Center",
        path: "simulation",
        icon: FlaskConical,
      },
      {
        label: "Reports & Analytics",
        path: "reports",
        icon: ChartNoAxesCombined,
      },
    ],
  },
];

const administrationGroup = {
  label: "Administration",
  items: [
    {
      label: "Operating Costs",
      path: "costs",
      icon: Wallet,
    },
    {
      label: "Staff Management",
      path: "staff",
      icon: Users,
    },
    {
      label: "Users & Roles",
      path: "users",
      icon: ShieldCheck,
    },
    {
      label: "Company Settings",
      path: "settings",
      icon: Settings,
    },
    {
      label: "Audit Logs",
      path: "audit",
      icon: ScrollText,
    },
  ],
};

export const tenantHomePaths = {
  tenant_admin: "/tenant",
  fleet_manager: "/fleet",
};

export const tenantRoleLabels = {
  tenant_admin: "Company Administrator",
  fleet_manager: "Fleet Manager",
};

export function getTenantNavigation(role) {
  const basePath = tenantHomePaths[role];

  if (!basePath) {
    return [];
  }

  const groups =
    role === "tenant_admin"
      ? [...sharedGroups, administrationGroup]
      : sharedGroups;

  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      path: item.path
        ? `${basePath}/${item.path}`
        : basePath,
    })),
  }));
}
