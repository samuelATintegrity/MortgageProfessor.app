"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteQuote } from "@/lib/actions/quotes";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface QuoteListItemProps {
  quote: {
    id: string;
    loan_type: string;
    base_loan_amount: number;
    property_value: number;
    loan_term_years: number;
    state: string;
    fico_score: number | null;
    client_name: string | null;
    name: string | null;
    created_at: string;
    quote_type: string;
  };
}

export function QuoteListItem({ quote }: QuoteListItemProps) {
  const date = new Date(quote.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const loanTypeLabel =
    quote.loan_type === "conventional"
      ? "Conv"
      : quote.loan_type === "fha"
      ? "FHA"
      : quote.loan_type === "va"
      ? "VA"
      : "$0 Down";

  const title = quote.name || quote.client_name
    ? `${quote.client_name || "Quote"} — ${fmt.format(quote.base_loan_amount)}`
    : `${loanTypeLabel} ${quote.loan_term_years}yr — ${fmt.format(quote.base_loan_amount)}`;

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{title}</p>
            <Badge variant="secondary" className="shrink-0">
              {loanTypeLabel}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>Value: {fmt.format(quote.property_value)}</span>
            {quote.fico_score && <span>FICO: {quote.fico_score}</span>}
            <span>{quote.state}</span>
            <span>{date}</span>
          </div>
        </div>
        <DeleteButton
          onDelete={() => deleteQuote(quote.id)}
          itemName="Quote"
        />
      </CardContent>
    </Card>
  );
}
