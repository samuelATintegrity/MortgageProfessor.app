import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, ArrowRight } from "lucide-react";

export default function SavedItemizedQuotesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved Itemized Quotes</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your saved itemized quotes
        </p>
      </div>
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
    </div>
  );
}
