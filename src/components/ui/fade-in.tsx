"use client";

import { useEffect, useState } from "react";

export function FadeIn({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure the initial opacity-0 renders first
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`transition-all duration-500 ${
        visible ? "opacity-100 blur-0" : "opacity-0 blur-sm"
      }`}
    >
      {children}
    </div>
  );
}
