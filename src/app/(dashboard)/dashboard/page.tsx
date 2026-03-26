import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Zap,
  TrendingDown,
  ClipboardList,
  Percent,
  ArrowRight,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const quickActions = [
  {
    title: "New Quick Quote",
    description: "Compare 3 rate options side by side",
    href: "/quotes/new",
    icon: Zap,
  },
  {
    title: "Refinance Analysis",
    description: "Calculate savings and break-even",
    href: "/refinance/new",
    icon: TrendingDown,
  },
  {
    title: "Itemized Quote",
    description: "Full closing cost breakdown",
    href: "/itemized/new",
    icon: ClipboardList,
  },
  {
    title: "Update Rate Sheet",
    description: "Enter today's rates",
    href: "/settings/rate-sheet",
    icon: Percent,
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: recentQuotes }, { data: recentRefi }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single(),
      supabase
        .from("quotes")
        .select("id, quote_type, loan_type, base_loan_amount, property_value, created_at, client_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("refi_analyses")
        .select("id, current_balance, new_rate, new_loan_term_years, created_at, client_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const displayName = profile?.full_name || "there";

  // Merge recent activity into one sorted list
  const recentActivity = [
    ...(recentQuotes ?? []).map((q) => ({
      id: q.id,
      type: q.quote_type === "itemized" ? "Itemized" : "Quick Quote",
      title: q.client_name || `${fmt.format(q.base_loan_amount)}`,
      subtitle: `${q.loan_type === "conventional" ? "Conv" : q.loan_type === "fha" ? "FHA" : q.loan_type === "va" ? "VA" : "$0 Down"} — ${fmt.format(q.property_value)} value`,
      href: q.quote_type === "itemized" ? "/itemized" : "/quotes",
      date: q.created_at,
    })),
    ...(recentRefi ?? []).map((r) => ({
      id: r.id,
      type: "Refi Analysis",
      title: r.client_name || `${fmt.format(r.current_balance)}`,
      subtitle: `${(r.new_rate * 100).toFixed(3)}% — ${r.new_loan_term_years}yr`,
      href: "/refinance",
      date: r.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {displayName}
        </h1>
        <p className="text-muted-foreground mt-1">
          What would you like to work on today?
        </p>
      </div>

      {/* Quick actions grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="h-full transition-colors hover:border-primary/50 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{action.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                No quotes yet. Create your first quote!
              </p>
              <Link href="/quotes/new" className={buttonVariants()}>
                Create Quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((item) => (
              <Link key={item.id} href={item.href}>
                <Card className="transition-colors hover:border-primary/30">
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate text-sm">
                          {item.title}
                        </p>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {item.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.subtitle}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0 ml-4">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
