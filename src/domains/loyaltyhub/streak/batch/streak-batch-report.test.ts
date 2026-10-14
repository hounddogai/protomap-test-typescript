import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStreakBatchReport } from "./streak-batch-report.js";
import { StreakBatch, newStreakBatch } from "./streak-batch.js";

test("StreakBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_474_174);
  const items: StreakBatch[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStreakBatch(`streak-batch-${index}`, "sample"));
  }
  const report = buildStreakBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
