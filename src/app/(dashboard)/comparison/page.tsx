import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ComparisonListItem } from "./comparison-list-item";

export default async function SavedComparisonsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: comparisons } = await supabase
    .from("comparisons")
    .select("id, name, competitor_lender, company_name, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Comparisons</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your saved competitor comparisons
          </p>
        </div>
        <Link href="/comparison/new" className={buttonVariants({ size: "sm" })}>
          <ArrowLeftRight className="h-4 w-4 mr-1" />
          New Comparison
        </Link>
      </div>

      {!comparisons || comparisons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ArrowLeftRight className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No comparisons saved yet</p>
            <Link href="/comparison/new" className={buttonVariants()}>
              Create Your First Comparison
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {comparisons.map((comp) => (
            <ComparisonListItem key={comp.id} comparison={comp} />
          ))}
        </div>
      )}
    </div>
  );
}
