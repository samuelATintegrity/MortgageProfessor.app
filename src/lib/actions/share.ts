"use server";

import { createClient } from "@/lib/supabase/server";

export async function createShareLink(data: {
  quoteInput: Record<string, unknown>;
  branding: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const token = crypto.randomUUID();

  const { error } = await supabase.from("shared_quotes").insert({
    user_id: user.id,
    token,
    quote_input: data.quoteInput,
    branding: data.branding,
  });

  if (error) return { error: error.message };

  return { success: true, token };
}
