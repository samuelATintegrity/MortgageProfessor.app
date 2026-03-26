import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ArrowRight, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuoteListItem } from "./quote-list-item";

export default async function SavedQuotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .eq("user_id", user.id)
    .eq("quote_type", "quick")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Quotes</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your saved quick quotes
          </p>
        </div>
        <Link href="/quotes/new" className={buttonVariants({ size: "sm" })}>
          <Zap className="h-4 w-4 mr-1" />
          New Quote
        </Link>
      </div>

      {!quotes || quotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No quotes saved yet</p>
            <Link href="/quotes/new" className={buttonVariants()}>
              Create Your First Quote
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => (
            <QuoteListItem key={quote.id} quote={quote} />
          ))}
        </div>
      )}
    </div>
  );
}
