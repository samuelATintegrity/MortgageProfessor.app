"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Zap,
  FileText,
  FolderOpen,
  ClipboardList,
  ArrowLeftRight,
  Calendar,
  TrendingDown,
  User,
  DollarSign,
  Percent,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: {
    email?: string;
    full_name?: string;
    company_name?: string;
  };
}

const mainNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Quick Quote", href: "/quotes/new", icon: Zap },
  { label: "Saved Quotes", href: "/quotes", icon: FileText },
  { label: "Refinance Analysis", href: "/refinance/new", icon: Percent },
  { label: "Saved Analyses", href: "/refinance", icon: FolderOpen },
  { label: "Itemized Quote", href: "/itemized/new", icon: ClipboardList },
  { label: "Saved Itemized", href: "/itemized", icon: FolderOpen },
  { label: "Compare Quotes", href: "/comparison/new", icon: ArrowLeftRight },
  { label: "Saved Comparisons", href: "/comparison", icon: FolderOpen },
  { label: "Daily Rates", href: "/daily-rates/new", icon: Calendar },
  { label: "Amortization", href: "/amortization/new", icon: TrendingDown },
];

const settingsNavItems = [
  { label: "Profile", href: "/settings", icon: User },
  { label: "Loan Costs", href: "/settings/loan-costs", icon: DollarSign },
];

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "U";
}

export function NavLinks({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/settings") return pathname === "/settings";
    // Exact match for list pages (e.g. /comparison, /quotes) to avoid matching /comparison/new
    if (!href.includes("/new") && pathname.startsWith(href + "/new")) return false;
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex flex-col gap-1">
      {mainNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          className={cn(
            "flex items-center rounded-lg text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
            isActive(item.href)
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70"
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && item.label}
        </Link>
      ))}

      <Separator className="my-3" />

      {!collapsed && (
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Settings
        </p>
      )}

      {settingsNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          className={cn(
            "flex items-center rounded-lg text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
            isActive(item.href)
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70"
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const initials = getInitials(user.full_name, user.email);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo + collapse toggle */}
      <div className={cn("flex items-center", collapsed ? "justify-center px-2 py-5" : "justify-between px-6 py-5")}>
        <Link href="/dashboard">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Mortgage Professor"
            className={cn("w-auto transition-all", collapsed ? "h-6" : "h-8")}
          />
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center mb-2">
          <button
            onClick={() => setCollapsed(false)}
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className={cn("flex-1 overflow-y-auto py-2", collapsed ? "px-1.5" : "px-3")}>
        <NavLinks collapsed={collapsed} />
      </div>

      {/* User info & sign out */}
      <div className="border-t border-sidebar-border p-4">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={handleSignOut}
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">
                  {user.full_name || user.email || "User"}
                </p>
                {user.company_name && (
                  <p className="truncate text-xs text-sidebar-foreground/60">
                    {user.company_name}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
