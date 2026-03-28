import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ComparisonEditor } from "./comparison-editor";

export default async function SavedComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: comparison } = await supabase
    .from("comparisons")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!comparison) notFound();

  return <ComparisonEditor comparison={comparison} />;
}
