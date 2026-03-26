import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, ArrowRight, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RefiListItem } from "./refi-list-item";

export default async function SavedAnalysesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: analyses } = await supabase
    .from("refi_analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Analyses</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your saved refinance analyses
          </p>
        </div>
        <Link href="/refinance/new" className={buttonVariants({ size: "sm" })}>
          <TrendingDown className="h-4 w-4 mr-1" />
          New Analysis
        </Link>
      </div>

      {!analyses || analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No analyses saved yet</p>
            <Link href="/refinance/new" className={buttonVariants()}>
              Create Your First Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <RefiListItem key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}
    </div>
  );
}
