/** Shape returned by the AI parsing of a competitor quote */
export interface CompetitorParseResult {
  lenderName: string;
  loanInfo: {
    loanAmount: number;
    propertyValue: number;
    interestRate: number;
    loanTerm: number;
    loanType: string;
  };
  closingCosts: Array<{
    label: string;
    value: number;
    category: string;
  }>;
  monthlyPayment: Array<{
    label: string;
    value: number;
    category: string;
  }>;
  totalClosingCosts: number;
  totalMonthlyPayment: number;
}

/** Row category for the comparison table */
export type ComparisonCategory = "loan_info" | "closing_costs" | "monthly_payment";

/** A single row in the comparison table */
export interface ComparisonRow {
  id: string;
  category: ComparisonCategory;
  competitorLabel: string;
  userLabel: string;
  competitorValue: number;
  userValue: number;
}
