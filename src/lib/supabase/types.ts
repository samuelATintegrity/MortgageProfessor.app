export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          company_name: string | null;
          nmls_number: string | null;
          phone: string | null;
          email: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          company_name?: string | null;
          nmls_number?: string | null;
          phone?: string | null;
          email: string;
          logo_url?: string | null;
        };
        Update: {
          full_name?: string;
          company_name?: string | null;
          nmls_number?: string | null;
          phone?: string | null;
          email?: string;
          logo_url?: string | null;
        };
      };
      loan_costs: {
        Row: {
          id: string;
          user_id: string;
          appraisal_fee: number;
          processing_fee: number;
          underwriting_fee: number;
          voe_credit_fee: number;
          tax_fee: number;
          mers_fee: number;
          borrower_paid_comp: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          appraisal_fee?: number;
          processing_fee?: number;
          underwriting_fee?: number;
          voe_credit_fee?: number;
          tax_fee?: number;
          mers_fee?: number;
          borrower_paid_comp?: number | null;
        };
        Update: {
          appraisal_fee?: number;
          processing_fee?: number;
          underwriting_fee?: number;
          voe_credit_fee?: number;
          tax_fee?: number;
          mers_fee?: number;
          borrower_paid_comp?: number | null;
        };
      };
      rate_sheets: {
        Row: {
          id: string;
          user_id: string;
          effective_date: string;
          loan_type: string;
          low_rate: number;
          low_rate_cost: number;
          par_rate: number;
          par_rate_cost: number;
          low_cost_rate: number;
          low_cost_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          effective_date?: string;
          loan_type: string;
          low_rate: number;
          low_rate_cost: number;
          par_rate: number;
          par_rate_cost: number;
          low_cost_rate: number;
          low_cost_cost: number;
        };
        Update: {
          effective_date?: string;
          loan_type?: string;
          low_rate?: number;
          low_rate_cost?: number;
          par_rate?: number;
          par_rate_cost?: number;
          low_cost_rate?: number;
          low_cost_cost?: number;
        };
      };
      quotes: {
        Row: {
          id: string;
          user_id: string;
          quote_type: string;
          transaction_type: string;
          fico_score: number | null;
          loan_type: string;
          borrower_or_lender_paid: string;
          borrower_paid_comp_pct: number | null;
          base_loan_amount: number;
          property_value: number;
          loan_term_years: number;
          state: string;
          lock_period_days: number;
          hazard_insurance_monthly: number | null;
          mortgage_insurance_monthly: number | null;
          property_tax_monthly: number | null;
          prepaid_interest_days: number | null;
          current_balance: number | null;
          seller_credit: number;
          buydown_amount: number;
          va_funding_fee: number;
          down_payment_pct: number | null;
          results: Record<string, unknown>;
          name: string | null;
          client_name: string | null;
          client_email: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["quotes"]["Row"], "id" | "created_at" | "updated_at" | "is_archived"> & { is_archived?: boolean };
        Update: Partial<Omit<Database["public"]["Tables"]["quotes"]["Row"], "id" | "created_at" | "user_id">>;
      };
      refi_analyses: {
        Row: {
          id: string;
          user_id: string;
          current_rate: number;
          current_balance: number;
          current_monthly_payment: number;
          current_loan_origination_date: string | null;
          current_remaining_months: number | null;
          new_rate: number;
          new_loan_amount: number;
          new_loan_term_years: number;
          new_closing_costs: number;
          results: Record<string, unknown>;
          client_name: string | null;
          name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["refi_analyses"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Database["public"]["Tables"]["refi_analyses"]["Row"], "id" | "created_at" | "user_id">>;
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          template_type: string;
          config: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          template_type: string;
          config: Record<string, unknown>;
        };
        Update: {
          name?: string;
          template_type?: string;
          config?: Record<string, unknown>;
        };
      };
    };
  };
};
