"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteRefiAnalysis } from "@/lib/actions/quotes";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function fmtRate(rate: number) {
  return (rate * 100).toFixed(3) + "%";
}

interface RefiListItemProps {
  analysis: {
    id: string;
    current_rate: number;
    current_balance: number;
    new_rate: number;
    new_loan_amount: number;
    new_loan_term_years: number;
    new_closing_costs: number;
    client_name: string | null;
    name: string | null;
    created_at: string;
  };
}

export function RefiListItem({ analysis }: RefiListItemProps) {
  const date = new Date(analysis.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const title = analysis.name || analysis.client_name
    ? `${analysis.client_name || "Refi"} — ${fmt.format(analysis.current_balance)}`
    : `Refi ${fmt.format(analysis.current_balance)} at ${fmtRate(analysis.new_rate)}`;

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="space-y-1 min-w-0">
          <p className="font-medium truncate">{title}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              {fmtRate(analysis.current_rate)} &rarr; {fmtRate(analysis.new_rate)}
            </span>
            <span>{analysis.new_loan_term_years}yr term</span>
            <span>Costs: {fmt.format(analysis.new_closing_costs)}</span>
            <span>{date}</span>
          </div>
        </div>
        <DeleteButton
          onDelete={() => deleteRefiAnalysis(analysis.id)}
          itemName="Analysis"
        />
      </CardContent>
    </Card>
  );
}
