import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SharedQuoteClient } from "./shared-quote-client";

export default async function SharedQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: share } = await supabase
    .from("shared_quotes")
    .select("quote_input, branding")
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (!share) notFound();

  return (
    <SharedQuoteClient
      quoteInput={share.quote_input as Record<string, unknown>}
      branding={share.branding as Record<string, unknown>}
    />
  );
}
