"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveQuote(data: {
  quoteType: string;
  transactionType: string;
  loanType: string;
  ficoScore: number;
  borrowerOrLenderPaid: string;
  borrowerPaidCompPct: number | null;
  baseLoanAmount: number;
  propertyValue: number;
  loanTermYears: number;
  state: string;
  lockPeriodDays: number;
  hazardInsuranceMonthly: number;
  mortgageInsuranceMonthly: number;
  propertyTaxMonthly: number;
  prepaidInterestDays: number;
  sellerCredit: number;
  buydownAmount: number;
  vaFundingFee: number;
  results: Record<string, unknown>;
  name?: string;
  clientName?: string;
  clientEmail?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("quotes").insert({
    user_id: user.id,
    quote_type: data.quoteType,
    transaction_type: data.transactionType,
    loan_type: data.loanType,
    fico_score: data.ficoScore,
    borrower_or_lender_paid: data.borrowerOrLenderPaid,
    borrower_paid_comp_pct: data.borrowerPaidCompPct,
    base_loan_amount: data.baseLoanAmount,
    property_value: data.propertyValue,
    loan_term_years: data.loanTermYears,
    state: data.state,
    lock_period_days: data.lockPeriodDays,
    hazard_insurance_monthly: data.hazardInsuranceMonthly,
    mortgage_insurance_monthly: data.mortgageInsuranceMonthly,
    property_tax_monthly: data.propertyTaxMonthly,
    prepaid_interest_days: data.prepaidInterestDays,
    seller_credit: data.sellerCredit,
    buydown_amount: data.buydownAmount,
    va_funding_fee: data.vaFundingFee,
    results: data.results,
    name: data.name || null,
    client_name: data.clientName || null,
    client_email: data.clientEmail || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/quotes");
  revalidatePath("/itemized");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteQuote(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/quotes");
  revalidatePath("/itemized");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function saveRefiAnalysis(data: {
  currentRate: number;
  currentBalance: number;
  currentMonthlyPayment: number;
  currentLoanOriginationDate: string | null;
  currentRemainingMonths: number | null;
  newRate: number;
  newLoanAmount: number;
  newLoanTermYears: number;
  newClosingCosts: number;
  results: Record<string, unknown>;
  name?: string;
  clientName?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("refi_analyses").insert({
    user_id: user.id,
    current_rate: data.currentRate,
    current_balance: data.currentBalance,
    current_monthly_payment: data.currentMonthlyPayment,
    current_loan_origination_date: data.currentLoanOriginationDate,
    current_remaining_months: data.currentRemainingMonths,
    new_rate: data.newRate,
    new_loan_amount: data.newLoanAmount,
    new_loan_term_years: data.newLoanTermYears,
    new_closing_costs: data.newClosingCosts,
    results: data.results,
    name: data.name || null,
    client_name: data.clientName || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/refinance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteRefiAnalysis(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("refi_analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/refinance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function saveTemplate(data: {
  name: string;
  templateType: string;
  config: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("templates").insert({
    user_id: user.id,
    name: data.name,
    template_type: data.templateType,
    config: data.config,
  });

  if (error) return { error: error.message };

  revalidatePath("/settings/templates");
  return { success: true };
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings/templates");
  return { success: true };
}

export async function saveComparison(data: {
  id?: string;
  name: string;
  competitorLender: string;
  competitorFileName: string | null;
  companyName: string;
  rows: unknown[];
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const payload = {
      user_id: user.id,
      name: data.name || null,
      competitor_lender: data.competitorLender || null,
      competitor_file_name: data.competitorFileName || null,
      company_name: data.companyName || null,
      rows: data.rows,
    };

    if (data.id) {
      // Update existing
      const { error } = await supabase
        .from("comparisons")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", user.id);

      if (error) return { error: error.message };

      revalidatePath("/comparison");
      return { success: true, id: data.id };
    }

    // Insert new
    const { data: inserted, error } = await supabase
      .from("comparisons")
      .insert(payload)
      .select("id")
      .single();

    if (error) return { error: error.message };

    revalidatePath("/comparison");
    return { success: true, id: inserted.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save comparison";
    return { error: message };
  }
}

export async function deleteComparison(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("comparisons")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/comparison");
  return { success: true };
}
