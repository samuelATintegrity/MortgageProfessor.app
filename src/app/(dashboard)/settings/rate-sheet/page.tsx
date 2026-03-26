"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Loader2,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

// ── Types ────────────────────────────────────────────────────────────────────

const LOAN_TYPES = ["conventional", "fha", "va", "zero_down"] as const;
type LoanType = (typeof LOAN_TYPES)[number];

const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  conventional: "Conventional",
  fha: "FHA",
  va: "VA",
  zero_down: "$0 Down",
};

const TIERS = ["low_rate", "par_rate", "low_cost"] as const;
type Tier = (typeof TIERS)[number];

const TIER_LABELS: Record<Tier, string> = {
  low_rate: "Low Rate",
  par_rate: "Par Rate",
  low_cost: "Low Cost",
};

// ── Schema ───────────────────────────────────────────────────────────────────

const tierSchema = z.object({
  rate: z.coerce
    .number({ invalid_type_error: "Enter a valid rate" })
    .min(0, "Rate must be positive")
    .max(100, "Rate must be 100 or less"),
  cost_credit: z.coerce.number({
    invalid_type_error: "Enter a valid cost/credit",
  }),
});

const loanTypeSchema = z.object({
  low_rate: tierSchema,
  par_rate: tierSchema,
  low_cost: tierSchema,
});

const rateSheetSchema = z.object({
  conventional: loanTypeSchema,
  fha: loanTypeSchema,
  va: loanTypeSchema,
  zero_down: loanTypeSchema,
});

type RateSheetValues = z.infer<typeof rateSheetSchema>;

// ── Defaults ─────────────────────────────────────────────────────────────────

function emptyTier() {
  return { rate: 0, cost_credit: 0 };
}

function emptyLoanType() {
  return { low_rate: emptyTier(), par_rate: emptyTier(), low_cost: emptyTier() };
}

function emptySheet(): RateSheetValues {
  return {
    conventional: emptyLoanType(),
    fha: emptyLoanType(),
    va: emptyLoanType(),
    zero_down: emptyLoanType(),
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RateSheetPage() {
  const supabase = createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const todayDisplay = format(new Date(), "MMMM d, yyyy");

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RateSheetValues>({
    resolver: zodResolver(rateSheetSchema),
    defaultValues: emptySheet(),
  });

  // ── Fetch today's rates ───────────────────────────────────────────────────

  const loadRates = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rows } = await supabase
        .from("rate_sheets")
        .select()
        .eq("user_id", user.id)
        .eq("effective_date", today);

      if (rows && rows.length > 0) {
        const sheet = emptySheet();
        for (const row of rows) {
          const lt = row.loan_type as LoanType;
          const t = row.tier as Tier;
          if (sheet[lt] && sheet[lt][t]) {
            // DB stores rates as decimals (0.065 = 6.5%), convert to display %
            sheet[lt][t] = {
              rate: row.rate != null ? row.rate * 100 : 0,
              cost_credit:
                row.cost_credit != null ? row.cost_credit * 100 : 0,
            };
          }
        }
        reset(sheet);
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  // ── Submit ────────────────────────────────────────────────────────────────

  async function onSubmit(values: RateSheetValues) {
    setMsg(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Build upsert rows for all loan types / tiers
      const rows: Array<{
        user_id: string;
        effective_date: string;
        loan_type: LoanType;
        tier: Tier;
        rate: number;
        cost_credit: number;
      }> = [];

      for (const lt of LOAN_TYPES) {
        for (const t of TIERS) {
          rows.push({
            user_id: user.id,
            effective_date: today,
            loan_type: lt,
            tier: t,
            // Convert display % back to decimal for DB storage
            rate: values[lt][t].rate / 100,
            cost_credit: values[lt][t].cost_credit / 100,
          });
        }
      }

      const { error } = await supabase.from("rate_sheets").upsert(rows, {
        onConflict: "user_id,effective_date,loan_type,tier",
      });

      if (error) throw error;
      setMsg({ type: "success", text: "Rate sheet saved successfully." });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save rate sheet.";
      setMsg({ type: "error", text: message });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function MessageBanner({
    msg,
  }: {
    msg: { type: "success" | "error"; text: string } | null;
  }) {
    if (!msg) return null;
    return (
      <div
        className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm ${
          msg.type === "success"
            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
        }`}
      >
        {msg.type === "success" ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 shrink-0" />
        )}
        {msg.text}
      </div>
    );
  }

  // Resolve nested form errors safely
  function getNestedError(
    loanType: LoanType,
    tier: Tier,
    field: "rate" | "cost_credit"
  ): string | undefined {
    return (
      errors?.[loanType]?.[tier]?.[field]?.message as string | undefined
    );
  }

  // ── Tier row component ────────────────────────────────────────────────────

  function TierRow({
    loanType,
    tier,
  }: {
    loanType: LoanType;
    tier: Tier;
  }) {
    const rateId = `${loanType}.${tier}.rate`;
    const costId = `${loanType}.${tier}.cost_credit`;
    const rateError = getNestedError(loanType, tier, "rate");
    const costError = getNestedError(loanType, tier, "cost_credit");

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium">{TIER_LABELS[tier]}</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={rateId}>Rate (%)</Label>
            <div className="relative">
              <Input
                id={rateId}
                type="number"
                step="0.001"
                className="pr-8"
                placeholder="6.250"
                {...register(
                  `${loanType}.${tier}.rate` as const
                )}
              />
              <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                %
              </span>
            </div>
            {rateError && (
              <p className="text-sm text-destructive">{rateError}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={costId}>Cost / Credit (%)</Label>
            <div className="relative">
              <Input
                id={costId}
                type="number"
                step="0.001"
                className="pr-8"
                placeholder="0.000"
                {...register(
                  `${loanType}.${tier}.cost_credit` as const
                )}
              />
              <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                %
              </span>
            </div>
            {costError && (
              <p className="text-sm text-destructive">{costError}</p>
            )}
            {tier === "low_rate" && (
              <p className="text-xs text-muted-foreground">
                Negative = cost to borrower (discount points)
              </p>
            )}
            {tier === "low_cost" && (
              <p className="text-xs text-muted-foreground">
                Positive = credit to borrower (lender credit)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rate Sheet</h1>
        <p className="text-muted-foreground mt-1">
          Enter today&apos;s rates for each loan type
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-4 py-3 text-sm">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span>
          Effective date: <strong>{todayDisplay}</strong>
        </span>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <strong>Percentage convention:</strong> Enter rates and costs as
          percentages (e.g. type &quot;6.25&quot; for 6.25%). Values are stored
          as decimals in the database (0.0625). For cost/credit: negative values
          represent a cost to the borrower (discount points); positive values
          represent a credit from the lender.
        </div>
      </div>

      <MessageBanner msg={msg} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="conventional">
          <TabsList>
            {LOAN_TYPES.map((lt) => (
              <TabsTrigger key={lt} value={lt}>
                {LOAN_TYPE_LABELS[lt]}
              </TabsTrigger>
            ))}
          </TabsList>

          {LOAN_TYPES.map((lt) => (
            <TabsContent key={lt} value={lt}>
              <Card>
                <CardHeader>
                  <CardTitle>{LOAN_TYPE_LABELS[lt]} Rates</CardTitle>
                  <CardDescription>
                    Enter three rate tiers for {LOAN_TYPE_LABELS[lt]} loans
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <TierRow loanType={lt} tier="low_rate" />
                  <Separator />
                  <TierRow loanType={lt} tier="par_rate" />
                  <Separator />
                  <TierRow loanType={lt} tier="low_cost" />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save All Rates
          </Button>
        </div>
      </form>
    </div>
  );
}
