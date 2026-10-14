import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedQueueMappingReport } from "./weighted-queue-mapping-report.js";
import { WeightedQueueMapping, newWeightedQueueMapping } from "./weighted-queue-mapping.js";

test("WeightedQueueMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_953_812);
  const items: WeightedQueueMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedQueueMapping(`weighted-queue-mapping-${index}`, "sample"));
  }
  const report = buildWeightedQueueMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
