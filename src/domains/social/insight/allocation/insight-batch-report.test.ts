import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInsightBatchReport } from "./insight-batch-report.js";
import { InsightBatch, newInsightBatch } from "./insight-batch.js";

test("InsightBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_146_426);
  const items: InsightBatch[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newInsightBatch(`insight-batch-${index}`, "sample"));
  }
  const report = buildInsightBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
