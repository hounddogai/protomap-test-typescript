import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveJourneyBatchReport } from "./adaptive-journey-batch-report.js";
import { AdaptiveJourneyBatch, newAdaptiveJourneyBatch } from "./adaptive-journey-batch.js";

test("AdaptiveJourneyBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_644_432);
  const items: AdaptiveJourneyBatch[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newAdaptiveJourneyBatch(`adaptive-journey-batch-${index}`, "sample"));
  }
  const report = buildAdaptiveJourneyBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
