import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedReputationAdjustmentReport } from "./weighted-reputation-adjustment-report.js";
import { WeightedReputationAdjustment, newWeightedReputationAdjustment } from "./weighted-reputation-adjustment.js";

test("WeightedReputationAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_714_429);
  const items: WeightedReputationAdjustment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedReputationAdjustment(`weighted-reputation-adjustment-${index}`, "sample"));
  }
  const report = buildWeightedReputationAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
