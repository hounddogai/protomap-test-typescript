import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredPlacementThresholdReport } from "./tiered-placement-threshold-report.js";
import { TieredPlacementThreshold, newTieredPlacementThreshold } from "./tiered-placement-threshold.js";

test("TieredPlacementThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_931_458);
  const items: TieredPlacementThreshold[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredPlacementThreshold(`tiered-placement-threshold-${index}`, "sample"));
  }
  const report = buildTieredPlacementThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
