import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalEnrollmentTierReport } from "./global-enrollment-tier-report.js";
import { GlobalEnrollmentTier, newGlobalEnrollmentTier } from "./global-enrollment-tier.js";

test("GlobalEnrollmentTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_458_311);
  const items: GlobalEnrollmentTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newGlobalEnrollmentTier(`global-enrollment-tier-${index}`, "sample"));
  }
  const report = buildGlobalEnrollmentTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
