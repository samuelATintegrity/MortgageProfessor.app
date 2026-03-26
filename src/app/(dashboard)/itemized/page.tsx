import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuoteListItem } from "../quotes/quote-list-item";

export default async function SavedItemizedQuotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .eq("user_id", user.id)
    .eq("quote_type", "itemized")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Itemized Quotes</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your saved itemized quotes
          </p>
        </div>
        <Link href="/itemized/new" className={buttonVariants({ size: "sm" })}>
          <ClipboardList className="h-4 w-4 mr-1" />
          New Itemized
        </Link>
      </div>

      {!quotes || quotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              No itemized quotes saved yet
            </p>
            <Link href="/itemized/new" className={buttonVariants()}>
              Create Your First Itemized Quote
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
