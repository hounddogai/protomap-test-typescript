import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderBatchReport } from "./sender-batch-report.js";
import { SenderBatch, newSenderBatch } from "./sender-batch.js";

test("SenderBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_027_363);
  const items: SenderBatch[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSenderBatch(`sender-batch-${index}`, "sample"));
  }
  const report = buildSenderBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
