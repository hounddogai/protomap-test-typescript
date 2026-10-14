import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientSuppressionThresholdReport } from "./lenient-suppression-threshold-report.js";
import { LenientSuppressionThreshold, newLenientSuppressionThreshold } from "./lenient-suppression-threshold.js";

test("LenientSuppressionThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_983_267);
  const items: LenientSuppressionThreshold[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientSuppressionThreshold(`lenient-suppression-threshold-${index}`, "sample"));
  }
  const report = buildLenientSuppressionThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
