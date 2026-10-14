import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedJourneyBatchReport } from "./weighted-journey-batch-report.js";
import { WeightedJourneyBatch, newWeightedJourneyBatch } from "./weighted-journey-batch.js";

test("WeightedJourneyBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_703_758);
  const items: WeightedJourneyBatch[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedJourneyBatch(`weighted-journey-batch-${index}`, "sample"));
  }
  const report = buildWeightedJourneyBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
