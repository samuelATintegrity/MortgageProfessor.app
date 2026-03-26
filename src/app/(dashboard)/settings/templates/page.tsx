import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TemplateListItem } from "./template-list-item";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-muted-foreground mt-1">
          Manage your quote and analysis templates
        </p>
      </div>

      {!templates || templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Copy className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No templates created yet. Save a template from any quote or analysis builder.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <TemplateListItem key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
