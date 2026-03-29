"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatWithCommas(value: number | undefined): string {
  if (value === undefined || value === 0) return "";
  // Format with commas, preserving decimals if present
  const parts = value.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function stripCommas(str: string): string {
  return str.replace(/,/g, "");
}

interface CurrencyInputProps {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  id: string;
  step?: string;
  className?: string;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  id,
  step = "0.01",
  className,
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [rawText, setRawText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync rawText when value changes externally and not focused
  useEffect(() => {
    if (!isFocused) {
      setRawText(formatWithCommas(value));
    }
  }, [value, isFocused]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Show raw number on focus for easy editing
    setRawText(value ? value.toString() : "");
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const parsed = parseFloat(stripCommas(rawText)) || 0;
    onChange(parsed);
    setRawText(formatWithCommas(parsed || undefined));
  }, [rawText, onChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      // Allow digits, decimal, commas, minus
      if (/^[\d,.\-]*$/.test(text)) {
        setRawText(text);
        const parsed = parseFloat(stripCommas(text)) || 0;
        onChange(parsed);
      }
    },
    [onChange]
  );

  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          $
        </span>
        <Input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          className="pl-7"
          value={rawText}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          step={step}
        />
      </div>
    </div>
  );
}
