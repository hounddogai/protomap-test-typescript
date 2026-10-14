import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWaitBatchReport } from "./wait-batch-report.js";
import { WaitBatch, newWaitBatch } from "./wait-batch.js";

test("WaitBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_490_166);
  const items: WaitBatch[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWaitBatch(`wait-batch-${index}`, "sample"));
  }
  const report = buildWaitBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
