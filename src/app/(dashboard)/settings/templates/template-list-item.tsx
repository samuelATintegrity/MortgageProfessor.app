"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteTemplate } from "@/lib/actions/quotes";

interface TemplateListItemProps {
  template: {
    id: string;
    name: string;
    template_type: string;
    created_at: string;
  };
}

const typeLabels: Record<string, string> = {
  quick_quote: "Quick Quote",
  itemized_quote: "Itemized Quote",
  refi_analysis: "Refi Analysis",
};

const typeLinks: Record<string, string> = {
  quick_quote: "/quotes/new",
  itemized_quote: "/itemized/new",
  refi_analysis: "/refinance/new",
};

export function TemplateListItem({ template }: TemplateListItemProps) {
  const date = new Date(template.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{template.name}</p>
            <Badge variant="secondary" className="shrink-0">
              {typeLabels[template.template_type] ?? template.template_type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link href={typeLinks[template.template_type] ?? "/quotes/new"}>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
          <DeleteButton
            onDelete={() => deleteTemplate(template.id)}
            itemName="Template"
          />
        </div>
      </CardContent>
    </Card>
  );
}
