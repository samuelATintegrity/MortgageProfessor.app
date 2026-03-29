"use client";

import { type RefObject, useState } from "react";
import { toPng, toCanvas } from "html-to-image";
import { Camera, FileDown, RotateCcw, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useComparisonStore } from "@/stores/comparison-store";
import { saveComparison } from "@/lib/actions/quotes";

interface ComparisonActionBarProps {
  captureRef: RefObject<HTMLDivElement | null>;
}

export function ComparisonActionBar({ captureRef }: ComparisonActionBarProps) {
  const reset = useComparisonStore((s) => s.reset);
  const hasData = useComparisonStore((s) => s.rows.length > 0);
  const savedId = useComparisonStore((s) => s.savedId);
  const setSavedId = useComparisonStore((s) => s.setSavedId);
  const rows = useComparisonStore((s) => s.rows);
  const lenderName = useComparisonStore((s) => s.lenderName);
  const companyName = useComparisonStore((s) => s.companyName);
  const competitorFileName = useComparisonStore((s) => s.competitorFileName);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCapture() {
    if (!captureRef.current) return;
    try {
      const dataUrl = await toPng(captureRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `quote-comparison-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Image captured", description: "Comparison saved as PNG" });
    } catch {
      toast({
        title: "Capture failed",
        description: "Could not generate image",
        variant: "destructive",
      });
    }
  }

  async function handleExportPdf() {
    if (!captureRef.current) return;
    try {
      toast({ title: "Generating PDF…", description: "Please wait" });

      const canvas = await toCanvas(captureRef.current, {
        quality: 1,
        pixelRatio: 2,
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const { jsPDF } = await import("jspdf");

      const pdfWidthMm = 210;
      const pdfHeightMm = (imgHeight / imgWidth) * pdfWidthMm;

      const pdf = new jsPDF({
        orientation: pdfHeightMm > pdfWidthMm ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidthMm, pdfHeightMm + 10],
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 5, pdfWidthMm, pdfHeightMm);
      pdf.save(`quote-comparison-${Date.now()}.pdf`);

      toast({ title: "PDF exported", description: "Comparison saved as PDF" });
    } catch {
      toast({
        title: "Export failed",
        description: "Could not generate PDF",
        variant: "destructive",
      });
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveComparison({
        id: savedId ?? undefined,
        name: saveName || `${companyName || "Quote"} vs ${lenderName || "Competitor"}`,
        competitorLender: lenderName,
        competitorFileName: competitorFileName,
        companyName,
        rows,
      });

      if (result.error) {
        toast({ title: "Save failed", description: result.error, variant: "destructive" });
      } else {
        if (result.id) setSavedId(result.id as string);
        setSaveDialogOpen(false);
        toast({ title: savedId ? "Updated" : "Saved", description: "Comparison saved successfully." });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickUpdate() {
    if (!savedId) return;
    setSaving(true);
    try {
      const result = await saveComparison({
        id: savedId,
        name: saveName || `${companyName || "Quote"} vs ${lenderName || "Competitor"}`,
        competitorLender: lenderName,
        competitorFileName: competitorFileName,
        companyName,
        rows,
      });

      if (result.error) {
        toast({ title: "Update failed", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Updated", description: "Comparison updated." });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleCapture} variant="default" size="sm" disabled={!hasData}>
        <Camera className="h-4 w-4" />
        Capture as Image
      </Button>
      <Button onClick={handleExportPdf} variant="outline" size="sm" disabled={!hasData}>
        <FileDown className="h-4 w-4" />
        Export PDF
      </Button>

      {savedId ? (
        <Button onClick={handleQuickUpdate} variant="outline" size="sm" disabled={saving || !hasData}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Update
        </Button>
      ) : (
        <>
          <Button variant="outline" size="sm" disabled={!hasData} onClick={() => setSaveDialogOpen(true)}>
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Save Comparison</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="compName">
                  Name
                </label>
                <Input
                  id="compName"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={`${companyName || "Quote"} vs ${lenderName || "Competitor"}`}
                />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Comparison
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </>
      )}

      <Button onClick={reset} variant="outline" size="sm">
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
    </div>
  );
}
