import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedPlacementEstimateReport } from "./weighted-placement-estimate-report.js";
import { WeightedPlacementEstimate, newWeightedPlacementEstimate } from "./weighted-placement-estimate.js";

test("WeightedPlacementEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_480_280);
  const items: WeightedPlacementEstimate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedPlacementEstimate(`weighted-placement-estimate-${index}`, "sample"));
  }
  const report = buildWeightedPlacementEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
