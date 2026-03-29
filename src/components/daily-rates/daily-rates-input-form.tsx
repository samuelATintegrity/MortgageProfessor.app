"use client";

import { useRef, useState, useCallback } from "react";
import {
  useDailyRatesStore,
  BUNDLED_BACKGROUNDS,
  FONT_OPTIONS,
  BUNDLED_FONTS,
  DIMENSION_PRESETS,
  getBackgroundsForDimension,
  type LoanProduct,
} from "@/stores/daily-rates-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Upload, X, AlignHorizontalDistributeCenter, AlignHorizontalSpaceAround, GripVertical } from "lucide-react";

function ProductRow({
  product,
  index,
  onUpdate,
  showScenario,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  product: LoanProduct;
  index: number;
  onUpdate: (partial: Partial<LoanProduct>) => void;
  showScenario: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
}) {
  return (
    <div
      className="border rounded-lg p-3 space-y-2 bg-white"
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab shrink-0" />
        <Switch
          id={`toggle-${product.id}`}
          checked={product.show}
          onCheckedChange={(val) => onUpdate({ show: val })}
        />
        <Label htmlFor={`toggle-${product.id}`} className="text-sm w-24 cursor-pointer">
          {product.label}
        </Label>
        <div className="relative flex-1">
          <Input
            id={`rate-${product.id}`}
            type="number"
            step="0.001"
            min={0}
            max={100}
            value={product.rate !== undefined ? parseFloat((product.rate * 100).toFixed(3)) : ""}
            onChange={(e) => onUpdate({ rate: (parseFloat(e.target.value) || 0) / 100 })}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            %
          </span>
        </div>
      </div>
      {showScenario && product.show && (
        <div className="grid grid-cols-3 gap-2 pl-6">
          <div className="space-y-0.5">
            <Label className="text-[10px] text-muted-foreground">Property Value</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              className="h-7 text-xs"
              value={product.propertyValue || ""}
              onChange={(e) => onUpdate({ propertyValue: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[10px] text-muted-foreground">Loan Amount</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              className="h-7 text-xs"
              value={product.loanAmount || ""}
              onChange={(e) => onUpdate({ loanAmount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[10px] text-muted-foreground">Credit Score</Label>
            <Input
              type="number"
              min={300}
              max={850}
              step={1}
              className="h-7 text-xs"
              value={product.creditScore || ""}
              onChange={(e) => onUpdate({ creditScore: parseInt(e.target.value) || 740 })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DailyRatesInputForm() {
  const { input, setInput, setProduct, reorderProducts } = useDailyRatesStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => setDragIndex(index), []);
  const handleDragOver = useCallback((e: React.DragEvent, _index: number) => {
    e.preventDefault();
  }, []);
  const handleDrop = useCallback((toIndex: number) => {
    if (dragIndex !== null && dragIndex !== toIndex) {
      reorderProducts(dragIndex, toIndex);
    }
    setDragIndex(null);
  }, [dragIndex, reorderProducts]);

  const googleFonts = FONT_OPTIONS.filter((f) => !BUNDLED_FONTS.includes(f));
  const customFonts = FONT_OPTIONS.filter((f) => BUNDLED_FONTS.includes(f));

  async function handleBackgroundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const dataUrl = await resizeImage(file, 1920);
      setInput({ customBackgroundImage: dataUrl, backgroundImage: dataUrl });
    } catch {
      // silently fail
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveCustomBackground() {
    setInput({
      customBackgroundImage: null,
      backgroundImage: BUNDLED_BACKGROUNDS[0],
    });
  }

  return (
    <div className="space-y-4">
      {/* Rates — drag to reorder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today&apos;s Rates</CardTitle>
          <p className="text-xs text-muted-foreground">Drag to reorder</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {input.products.map((product, index) => (
            <ProductRow
              key={product.id}
              product={product}
              index={index}
              onUpdate={(partial) => setProduct(product.id, partial)}
              showScenario={input.showScenarioDescriptions}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Font selector */}
          <div className="space-y-1">
            <Label>Headline Font</Label>
            <select
              value={input.headlineFont}
              onChange={(e) => setInput({ headlineFont: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <optgroup label="Google Fonts">
                {googleFonts.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Custom Fonts">
                {customFonts.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Font size */}
          <div className="space-y-1">
            <Label>Headline Size ({input.headlineFontSize}px)</Label>
            <input
              type="range"
              min={16}
              max={48}
              step={1}
              value={input.headlineFontSize}
              onChange={(e) =>
                setInput({ headlineFontSize: parseInt(e.target.value) })
              }
              className="w-full"
            />
          </div>

          {/* Colors */}
          <div className="flex items-center gap-6">
            <div className="space-y-1">
              <Label className="text-xs">Headline Color</Label>
              <ColorPicker
                value={input.headlineColor}
                onChange={(color) => setInput({ headlineColor: color })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rate Text Color</Label>
              <ColorPicker
                value={input.rateTextColor}
                onChange={(color) => setInput({ rateTextColor: color })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {getBackgroundsForDimension(input.outputWidth, input.outputHeight).map((bg, i) => {
              const isActive = input.backgroundImage === bg;
              return (
                <button
                  key={bg}
                  type="button"
                  className={`aspect-[9/16] rounded-md border-2 overflow-hidden transition-colors ${
                    isActive
                      ? "border-blue-600 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  onClick={() => setInput({ backgroundImage: bg })}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bg}
                    alt={`Background ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}

            {/* Custom upload thumbnail */}
            {input.customBackgroundImage && (
              <button
                type="button"
                className={`aspect-[9/16] rounded-md border-2 overflow-hidden transition-colors relative ${
                  input.backgroundImage === input.customBackgroundImage
                    ? "border-blue-600 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                onClick={() =>
                  setInput({ backgroundImage: input.customBackgroundImage! })
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={input.customBackgroundImage}
                  alt="Custom"
                  className="w-full h-full object-cover"
                />
              </button>
            )}
          </div>

          {/* Upload / Remove */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload Background
            </Button>
            {input.customBackgroundImage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveCustomBackground}
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBackgroundUpload}
          />

          {/* Image position slider for non-SVG images */}
          {input.backgroundImage &&
            !input.backgroundImage.endsWith(".svg") && (
              <div className="space-y-1">
                <Label>Image Position</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={input.backgroundPosition}
                  onChange={(e) =>
                    setInput({ backgroundPosition: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            )}

          {/* Overlay opacity */}
          <div className="space-y-1">
            <Label>
              Overlay Darkness ({Math.round(input.overlayOpacity * 100)}%)
            </Label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(input.overlayOpacity * 100)}
              onChange={(e) =>
                setInput({ overlayOpacity: parseInt(e.target.value) / 100 })
              }
              className="w-full"
            />
          </div>

          {/* White overlay opacity */}
          <div className="space-y-1">
            <Label>
              White Overlay ({Math.round(input.whiteOverlayOpacity * 100)}%)
            </Label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(input.whiteOverlayOpacity * 100)}
              onChange={(e) =>
                setInput({ whiteOverlayOpacity: parseInt(e.target.value) / 100 })
              }
              className="w-full"
            />
          </div>

          {/* Background blur */}
          <div className="space-y-1">
            <Label>
              Background Blur ({input.blurIntensity}px)
            </Label>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={input.blurIntensity}
              onChange={(e) =>
                setInput({ blurIntensity: parseInt(e.target.value) })
              }
              className="w-full"
            />
          </div>

          {/* Rate card background toggle */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Switch
              id="toggle-rate-card-bg"
              checked={input.showRateCardBg}
              onCheckedChange={(val) => setInput({ showRateCardBg: val })}
            />
            <Label htmlFor="toggle-rate-card-bg" className="cursor-pointer">
              Show rate card backgrounds
            </Label>
          </div>

          {/* Rate card layout */}
          <div className="space-y-1 pt-2 border-t">
            <Label>Rate Card Layout</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={input.rateCardLayout === "sides" ? "default" : "outline"}
                size="sm"
                onClick={() => setInput({ rateCardLayout: "sides" })}
              >
                <AlignHorizontalSpaceAround className="h-4 w-4 mr-1" />
                Sides
              </Button>
              <Button
                type="button"
                variant={input.rateCardLayout === "center" ? "default" : "outline"}
                size="sm"
                onClick={() => setInput({ rateCardLayout: "center" })}
              >
                <AlignHorizontalDistributeCenter className="h-4 w-4 mr-1" />
                Center
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dimensions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DIMENSION_PRESETS.map((preset) => {
              const isActive =
                input.outputWidth === preset.w &&
                input.outputHeight === preset.h;
              return (
                <Button
                  key={preset.label}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setInput({ outputWidth: preset.w, outputHeight: preset.h })
                  }
                >
                  {preset.label}
                  <span className="text-xs ml-1 opacity-60">
                    {preset.w}x{preset.h}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Date */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={input.date}
            onChange={(e) => setInput({ date: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Scenario Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Scenario Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Switch
              id="toggle-scenario"
              checked={input.showScenarioDescriptions}
              onCheckedChange={(val) =>
                setInput({ showScenarioDescriptions: val })
              }
            />
            <Label htmlFor="toggle-scenario" className="cursor-pointer">
              Show scenario descriptions on image
            </Label>
          </div>
          {input.showScenarioDescriptions && (
            <p className="text-xs text-muted-foreground mt-2">
              Edit each product&apos;s scenario in the rates section above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
