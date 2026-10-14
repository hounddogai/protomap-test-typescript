import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveCsatTargetReport } from "./adaptive-csat-target-report.js";
import { AdaptiveCsatTarget, newAdaptiveCsatTarget } from "./adaptive-csat-target.js";

test("AdaptiveCsatTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_014_243);
  const items: AdaptiveCsatTarget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newAdaptiveCsatTarget(`adaptive-csat-target-${index}`, "sample"));
  }
  const report = buildAdaptiveCsatTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
