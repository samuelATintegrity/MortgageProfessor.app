import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ArrowRight } from "lucide-react";

export default function SavedQuotesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved Quotes</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your saved quotes
        </p>
      </div>
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
    </div>
  );
}
