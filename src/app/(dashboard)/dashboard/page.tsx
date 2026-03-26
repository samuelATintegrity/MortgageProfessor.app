import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Zap,
  TrendingDown,
  ClipboardList,
  Percent,
  ArrowRight,
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || "there";

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

      {/* Recent Quotes */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Quotes</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No quotes yet. Create your first quote!
            </p>
            <Link href="/quotes/new" className={buttonVariants()}>
              Create Quote
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
