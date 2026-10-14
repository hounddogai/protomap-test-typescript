import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualPlacementThresholdReport } from "./manual-placement-threshold-report.js";
import { ManualPlacementThreshold, newManualPlacementThreshold } from "./manual-placement-threshold.js";

test("ManualPlacementThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_158_435);
  const items: ManualPlacementThreshold[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newManualPlacementThreshold(`manual-placement-threshold-${index}`, "sample"));
  }
  const report = buildManualPlacementThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
