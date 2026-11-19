import { describe, expect, it } from "vitest";
import { isCronAuthorized } from "@/lib/cron-auth";

describe("isCronAuthorized", () => {
  it("accepts only the bearer secret", () => {
    expect(isCronAuthorized("Bearer night-shift", "night-shift")).toBe(true);
    expect(isCronAuthorized("Bearer other", "night-shift")).toBe(false);
    expect(isCronAuthorized("night-shift", "night-shift")).toBe(false);
    expect(isCronAuthorized(null, "night-shift")).toBe(false);
    expect(isCronAuthorized("Bearer night-shift", undefined)).toBe(false);
    expect(isCronAuthorized("Bearer night-shift", "  ")).toBe(false);
  });
});
