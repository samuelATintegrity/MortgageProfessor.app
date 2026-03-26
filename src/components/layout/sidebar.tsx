"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Zap,
  FileText,
  TrendingDown,
  FolderOpen,
  ClipboardList,
  User,
  DollarSign,
  Percent,
  Copy,
  LogOut,
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
  { label: "Refinance Analysis", href: "/refinance/new", icon: TrendingDown },
  { label: "Saved Analyses", href: "/refinance", icon: FolderOpen },
  { label: "Itemized Quote", href: "/itemized/new", icon: ClipboardList },
  { label: "Saved Itemized", href: "/itemized", icon: FolderOpen },
];

const settingsNavItems = [
  { label: "Profile", href: "/settings", icon: User },
  { label: "Loan Costs", href: "/settings/loan-costs", icon: DollarSign },
  { label: "Rate Sheet", href: "/settings/rate-sheet", icon: Percent },
  { label: "Templates", href: "/settings/templates", icon: Copy },
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

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/settings") return pathname === "/settings";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex flex-col gap-1">
      {mainNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive(item.href)
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}

      <Separator className="my-3" />

      <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        Settings
      </p>

      {settingsNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive(item.href)
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const router = useRouter();
  const initials = getInitials(user.full_name, user.email);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5">
        <GraduationCap className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Mortgage Professor</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavLinks />
      </div>

      {/* User info & sign out */}
      <div className="border-t border-sidebar-border p-4">
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
      </div>
    </aside>
  );
}
