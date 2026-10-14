import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyComplaintVarianceReport } from "./legacy-complaint-variance-report.js";
import { LegacyComplaintVariance, newLegacyComplaintVariance } from "./legacy-complaint-variance.js";

test("LegacyComplaintVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_499_497);
  const items: LegacyComplaintVariance[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyComplaintVariance(`legacy-complaint-variance-${index}`, "sample"));
  }
  const report = buildLegacyComplaintVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
