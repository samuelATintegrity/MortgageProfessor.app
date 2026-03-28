"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteComparison } from "@/lib/actions/quotes";

interface ComparisonListItemProps {
  comparison: {
    id: string;
    name: string | null;
    competitor_lender: string | null;
    company_name: string | null;
    created_at: string;
    updated_at: string;
  };
}

export function ComparisonListItem({ comparison }: ComparisonListItemProps) {
  const date = new Date(comparison.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const title =
    comparison.name ||
    `${comparison.company_name || "Quote"} vs ${comparison.competitor_lender || "Competitor"}`;

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <Link
          href={`/comparison/${comparison.id}`}
          className="space-y-1 min-w-0 flex-1 hover:underline"
        >
          <p className="font-medium truncate">{title}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {comparison.competitor_lender && (
              <span>vs {comparison.competitor_lender}</span>
            )}
            <span>{date}</span>
          </div>
        </Link>
        <DeleteButton
          onDelete={() => deleteComparison(comparison.id)}
          itemName="Comparison"
        />
      </CardContent>
    </Card>
  );
}
