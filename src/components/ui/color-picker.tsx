"use client";

import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  function handleHexChange(hex: string) {
    setHexInput(hex);
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange(hex);
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        className="h-8 w-8 rounded-md border border-input shadow-sm cursor-pointer"
        style={{ backgroundColor: value }}
        onClick={() => setOpen(!open)}
        aria-label="Pick color"
      />
      {open && (
        <div className="absolute z-50 top-10 left-0 bg-white rounded-lg shadow-lg border p-3 space-y-2">
          <HexColorPicker color={value} onChange={onChange} />
          <Input
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="#000000"
            className="h-8 text-xs font-mono"
          />
        </div>
      )}
    </div>
  );
}
