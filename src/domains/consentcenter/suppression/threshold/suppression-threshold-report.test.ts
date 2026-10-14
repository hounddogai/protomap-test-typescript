import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionThresholdReport } from "./suppression-threshold-report.js";
import { SuppressionThreshold, newSuppressionThreshold } from "./suppression-threshold.js";

test("SuppressionThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_556_047);
  const items: SuppressionThreshold[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSuppressionThreshold(`suppression-threshold-${index}`, "sample"));
  }
  const report = buildSuppressionThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
