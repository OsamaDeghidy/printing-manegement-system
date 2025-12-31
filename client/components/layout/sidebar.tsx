"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "@/data/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  title?: string;
  navigation: NavItem[];
  footer?: React.ReactNode;
  onNavigate?: () => void;
}

export function Sidebar({
  title,
  navigation,
  footer,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-l border-border bg-surface">
      <div className="px-6 py-8">
        <div className="mb-4 flex items-center justify-center">
          <img 
            src="/logo.png" 
            alt="جامعة طيبة - Taibah University" 
            className="h-16 w-auto object-contain"
          />
        </div>
        <p className="text-lg font-semibold text-heading text-center">{title}</p>
        <p className="text-sm text-muted text-center">
          Taibah University Print Center Management
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-brand-teal/15 text-brand-teal border border-brand-teal/30"
                  : "text-muted hover:text-heading hover:bg-brand-teal/10"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {footer ? <div className="px-4 py-6">{footer}</div> : null}
    </aside>
  );
}


