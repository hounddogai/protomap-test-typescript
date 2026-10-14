import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientComplaintVarianceReport } from "./lenient-complaint-variance-report.js";
import { LenientComplaintVariance, newLenientComplaintVariance } from "./lenient-complaint-variance.js";

test("LenientComplaintVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_027_662);
  const items: LenientComplaintVariance[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientComplaintVariance(`lenient-complaint-variance-${index}`, "sample"));
  }
  const report = buildLenientComplaintVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
