import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionBatchReport } from "./suppression-batch-report.js";
import { SuppressionBatch, newSuppressionBatch } from "./suppression-batch.js";

test("SuppressionBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_632_492);
  const items: SuppressionBatch[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSuppressionBatch(`suppression-batch-${index}`, "sample"));
  }
  const report = buildSuppressionBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
