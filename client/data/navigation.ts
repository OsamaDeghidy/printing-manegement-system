export interface NavItem {
  label: string;
  href: string;
  icon: string;
  segment?: string;
}

export const userNavigation: NavItem[] = [
  {
    label: "الرئيسية",
    href: "/dashboard",
    icon: "🏠",
    segment: "dashboard",
  },
  {
    label: "طلباتي",
    href: "/orders",
    icon: "📝",
    segment: "orders",
  },
  {
    label: "الخدمات",
    href: "/services",
    icon: "🛠️",
    segment: "services",
  },
  {
    label: "الزيارات",
    href: "/visits",
    icon: "📅",
    segment: "visits",
  },
  {
    label: "الإشعارات",
    href: "/notifications",
    icon: "🔔",
    segment: "notifications",
  },
  {
    label: "الإعدادات",
    href: "/settings",
    icon: "⚙️",
    segment: "settings",
  },
  {
    label: "شرحه",
    href: "/guide",
    icon: "📖",
    segment: "guide",
  },
];

export const adminNavigation: NavItem[] = [
  {
    label: "نظرة عامة",
    href: "/admin/overview",
    icon: "📊",
    segment: "admin/overview",
  },
  {
    label: "إدارة المستخدمين",
    href: "/admin/users",
    icon: "👥",
    segment: "admin/users",
  },
  {
    label: "إدارة الجهات",
    href: "/admin/entities",
    icon: "🏢",
    segment: "admin/entities",
  },
  {
    label: "الخدمات والحقول",
    href: "/admin/services",
    icon: "🛠️",
    segment: "admin/services",
  },
  {
    label: "الإعدادات",
    href: "/admin/settings",
    icon: "⚙️",
    segment: "admin/settings",
  },
  {
    label: "إعدادات الاعتماد",
    href: "/admin/approvals",
    icon: "✅",
    segment: "admin/approvals",
  },
  {
    label: "المخزون",
    href: "/admin/inventory",
    icon: "📦",
    segment: "admin/inventory",
  },
  {
    label: "الأسعار",
    href: "/admin/pricing",
    icon: "💰",
    segment: "admin/pricing",
  },
  {
    label: "التقارير",
    href: "/admin/reports",
    icon: "📈",
    segment: "admin/reports",
  },
  {
    label: "السجلات",
    href: "/admin/logs",
    icon: "📜",
    segment: "admin/logs",
  },
];

// Training navigation (for training supervisors)
export const trainingNavigation: NavItem[] = [
  {
    label: "طلبات التدريب",
    href: "/admin/training",
    icon: "🎓",
    segment: "admin/training",
  },
];

/**
 * Get navigation items based on user role
 */
export function getNavigationForRole(role: string | undefined): NavItem[] {
  if (!role) {
    return userNavigation;
  }

  const baseNav = [...userNavigation];

  switch (role) {
    case "print_manager":
    case "admin":
      // Print managers and admins see everything
      return [...baseNav, ...adminNavigation];
    
    case "dept_manager":
      // Department managers see limited admin access
      return [
        ...baseNav,
        {
          label: "نظرة عامة",
          href: "/admin/overview",
          icon: "📊",
          segment: "admin/overview",
        },
        {
          label: "التقارير",
          href: "/admin/reports",
          icon: "📈",
          segment: "admin/reports",
        },
      ];
    
    case "dept_employee":
      // Department employees see basic navigation only
      return baseNav;
    
    case "training_supervisor":
      // Training supervisors see training admin
      return [...baseNav, ...trainingNavigation];
    
    case "inventory":
      // Inventory managers see inventory admin
      return [
        ...baseNav,
        {
          label: "المخزون",
          href: "/admin/inventory",
          icon: "📦",
          segment: "admin/inventory",
        },
      ];
    
    case "consumer":
    case "requester":
    default:
      // Consumers see only basic navigation
      return baseNav;
  }
}


