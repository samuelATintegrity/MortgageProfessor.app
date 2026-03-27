"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  DollarSign,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
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

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  appraisal_fee: 620,
  processing_fee: 700,
  underwriting_fee: 1150,
  voe_credit_fee: 200,
  tax_service_fee: 80,
  mers_fee: 30,
  borrower_paid_comp_pct: 0.9021,
};

// ── Schema ───────────────────────────────────────────────────────────────────

const loanCostsSchema = z.object({
  appraisal_fee: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .min(0, "Must be 0 or greater"),
  processing_fee: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .min(0, "Must be 0 or greater"),
  underwriting_fee: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .min(0, "Must be 0 or greater"),
  voe_credit_fee: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .min(0, "Must be 0 or greater"),
  tax_service_fee: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .min(0, "Must be 0 or greater"),
  mers_fee: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .min(0, "Must be 0 or greater"),
  borrower_paid_comp_pct: z.coerce
    .number({ invalid_type_error: "Enter a valid percentage" })
    .min(0, "Must be 0 or greater")
    .max(100, "Must be 100 or less"),
});

type LoanCostsValues = z.infer<typeof loanCostsSchema>;

// ── Component ────────────────────────────────────────────────────────────────

export default function LoanCostsPage() {
  const supabase = createClient();

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
  } = useForm<LoanCostsValues>({
    resolver: zodResolver(loanCostsSchema),
    defaultValues: DEFAULTS,
  });

  // ── Fetch on mount ────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("loan_costs")
          .select()
          .eq("user_id", user.id)
          .single();

        if (data) {
          reset({
            appraisal_fee: data.appraisal_fee ?? DEFAULTS.appraisal_fee,
            processing_fee: data.processing_fee ?? DEFAULTS.processing_fee,
            underwriting_fee:
              data.underwriting_fee ?? DEFAULTS.underwriting_fee,
            voe_credit_fee: data.voe_credit_fee ?? DEFAULTS.voe_credit_fee,
            tax_service_fee: data.tax_fee ?? DEFAULTS.tax_service_fee,
            mers_fee: data.mers_fee ?? DEFAULTS.mers_fee,
            borrower_paid_comp_pct:
              data.borrower_paid_comp != null
                ? data.borrower_paid_comp * 100
                : DEFAULTS.borrower_paid_comp_pct,
          });
        }
      } catch {
        // Use defaults if nothing found
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────

  async function onSubmit(values: LoanCostsValues) {
    setMsg(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("loan_costs").upsert({
        user_id: user.id,
        appraisal_fee: values.appraisal_fee,
        processing_fee: values.processing_fee,
        underwriting_fee: values.underwriting_fee,
        voe_credit_fee: values.voe_credit_fee,
        tax_fee: values.tax_service_fee,
        mers_fee: values.mers_fee,
        borrower_paid_comp: values.borrower_paid_comp_pct / 100,
      });

      if (error) throw error;
      setMsg({ type: "success", text: "Loan costs saved successfully." });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save loan costs.";
      setMsg({ type: "error", text: message });
    }
  }

  function handleResetDefaults() {
    reset(DEFAULTS);
    setMsg(null);
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

  // Currency input row helper
  function CurrencyField({
    id,
    label,
    fieldName,
    placeholder,
  }: {
    id: string;
    label: string;
    fieldName: keyof LoanCostsValues;
    placeholder?: string;
  }) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id={id}
            type="number"
            step="0.01"
            min="0"
            className="pl-8"
            placeholder={placeholder}
            {...register(fieldName)}
          />
        </div>
        {errors[fieldName] && (
          <p className="text-sm text-destructive">
            {errors[fieldName]?.message}
          </p>
        )}
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
        <h1 className="text-2xl font-bold">Loan Costs</h1>
        <p className="text-muted-foreground mt-1">
          Set your standard fees that apply to all quotes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Standard Fees</CardTitle>
          <CardDescription>
            These fees will be used as defaults when generating new quotes.
            Amounts are stored in dollars; the compensation percentage is stored
            as a decimal (e.g. 0.9021% is stored as 0.009021).
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <MessageBanner msg={msg} />

            <div className="grid gap-4 sm:grid-cols-2">
              <CurrencyField
                id="appraisal_fee"
                label="Appraisal Fee"
                fieldName="appraisal_fee"
                placeholder="620.00"
              />
              <CurrencyField
                id="processing_fee"
                label="Processing Fee"
                fieldName="processing_fee"
                placeholder="700.00"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <CurrencyField
                id="underwriting_fee"
                label="Underwriting Fee"
                fieldName="underwriting_fee"
                placeholder="1150.00"
              />
              <CurrencyField
                id="voe_credit_fee"
                label="VOE / Credit Fee"
                fieldName="voe_credit_fee"
                placeholder="200.00"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <CurrencyField
                id="tax_service_fee"
                label="Tax Service Fee"
                fieldName="tax_service_fee"
                placeholder="80.00"
              />
              <CurrencyField
                id="mers_fee"
                label="MERS Fee"
                fieldName="mers_fee"
                placeholder="30.00"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="borrower_paid_comp_pct">
                Borrower Paid Compensation (%)
              </Label>
              <div className="relative">
                <Input
                  id="borrower_paid_comp_pct"
                  type="number"
                  step="0.0001"
                  min="0"
                  max="100"
                  className="pr-8"
                  placeholder="0.9021"
                  {...register("borrower_paid_comp_pct")}
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                  %
                </span>
              </div>
              {errors.borrower_paid_comp_pct && (
                <p className="text-sm text-destructive">
                  {errors.borrower_paid_comp_pct.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter as a percentage (e.g. 0.9021). Stored as a decimal in the
                database (0.009021).
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetDefaults}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Loan Costs
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
