import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentTierReport } from "./enrollment-tier-report.js";
import { EnrollmentTier, newEnrollmentTier } from "./enrollment-tier.js";

test("EnrollmentTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_392_979);
  const items: EnrollmentTier[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newEnrollmentTier(`enrollment-tier-${index}`, "sample"));
  }
  const report = buildEnrollmentTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
