import { Card, CardContent } from "@/components/ui/card";
import { Copy } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-muted-foreground mt-1">
          Manage your quote and analysis templates
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Copy className="h-10 w-10 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            No templates created yet. Templates will appear here once you save
            your first one.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
