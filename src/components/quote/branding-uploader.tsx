"use client";

import { useState, useRef } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface BrandingUploaderProps {
  currentUrl: string | null;
  onUpload: (url: string | null) => void;
}

export function BrandingUploader({ currentUrl, onUpload }: BrandingUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() ?? "png";
      const path = `${user.id}/logo.${ext}`;

      // Upload to storage (upsert)
      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("branding")
        .getPublicUrl(path);

      // Update profile
      await supabase
        .from("profiles")
        .update({ logo_url: publicUrl })
        .eq("id", user.id);

      onUpload(publicUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ logo_url: null })
        .eq("id", user.id);

      onUpload(null);
    } catch {
      setError("Failed to remove image.");
    }
  }

  return (
    <div className="space-y-3">
      {currentUrl ? (
        <div className="flex items-start gap-4">
          <div className="rounded-md border bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt="Branding logo"
              className="max-h-20 w-auto object-contain"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
          >
            <X className="mr-1 h-3 w-3" />
            Remove
          </Button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Click to upload your branding image</p>
          <p className="text-xs text-gray-400 mt-1">Any image dimension works</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      {currentUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Upload className="mr-1 h-3 w-3" />
          )}
          Change Image
        </Button>
      )}

      {uploading && !currentUrl && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading...
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
