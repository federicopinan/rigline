"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyLink({ path }: { path: string }) {
  const [label, setLabel] = useState("Copy share link");

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setLabel("Link copied");
    } catch {
      setLabel("Copy failed");
    }
  }

  return (
    <Button type="button" variant="outline" className="h-10" onClick={() => void copy()}>
      {label}
    </Button>
  );
}
