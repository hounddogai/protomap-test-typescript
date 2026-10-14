import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedPlacementBatchReport } from "./weighted-placement-batch-report.js";
import { WeightedPlacementBatch, newWeightedPlacementBatch } from "./weighted-placement-batch.js";

test("WeightedPlacementBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_386_285);
  const items: WeightedPlacementBatch[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedPlacementBatch(`weighted-placement-batch-${index}`, "sample"));
  }
  const report = buildWeightedPlacementBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
