"use client";

import { useDailyRatesStore, BUNDLED_BACKGROUNDS } from "@/stores/daily-rates-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

function RateRow({
  label,
  id,
  rate,
  show,
  onRateChange,
  onToggle,
}: {
  label: string;
  id: string;
  rate: number;
  show: boolean;
  onRateChange: (val: number) => void;
  onToggle: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Switch
        id={`toggle-${id}`}
        checked={show}
        onCheckedChange={onToggle}
      />
      <Label htmlFor={`toggle-${id}`} className="text-sm w-28 cursor-pointer">
        {label}
      </Label>
      <div className="relative flex-1">
        <Input
          id={id}
          type="number"
          step="0.001"
          min={0}
          max={100}
          value={rate !== undefined ? parseFloat((rate * 100).toFixed(3)) : ""}
          onChange={(e) => onRateChange((parseFloat(e.target.value) || 0) / 100)}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          %
        </span>
      </div>
    </div>
  );
}

export function DailyRatesInputForm() {
  const { input, setInput } = useDailyRatesStore();

  return (
    <div className="space-y-4">
      {/* Rates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today&apos;s Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RateRow
            label="Conventional"
            id="conventional"
            rate={input.conventional}
            show={input.showConventional}
            onRateChange={(val) => setInput({ conventional: val })}
            onToggle={(val) => setInput({ showConventional: val })}
          />
          <RateRow
            label="FHA"
            id="fha"
            rate={input.fha}
            show={input.showFha}
            onRateChange={(val) => setInput({ fha: val })}
            onToggle={(val) => setInput({ showFha: val })}
          />
          <RateRow
            label="VA"
            id="va"
            rate={input.va}
            show={input.showVa}
            onRateChange={(val) => setInput({ va: val })}
            onToggle={(val) => setInput({ showVa: val })}
          />
          <RateRow
            label="USDA"
            id="usda"
            rate={input.usda}
            show={input.showUsda}
            onRateChange={(val) => setInput({ usda: val })}
            onToggle={(val) => setInput({ showUsda: val })}
          />
        </CardContent>
      </Card>

      {/* Background Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {BUNDLED_BACKGROUNDS.map((bg, i) => {
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
          </div>

          {/* Custom upload would go here — for now, bundled only */}

          {/* Vertical position slider for custom uploaded images */}
          {input.backgroundImage && !input.backgroundImage.endsWith(".svg") && (
            <div className="space-y-1">
              <Label>Image Position</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={input.backgroundPosition}
                onChange={(e) => setInput({ backgroundPosition: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          )}
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
    </div>
  );
}
