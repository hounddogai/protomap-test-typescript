import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildOptOutBatchReport } from "./opt-out-batch-report.js";
import { OptOutBatch, newOptOutBatch } from "./opt-out-batch.js";

test("OptOutBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_511_976);
  const items: OptOutBatch[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newOptOutBatch(`opt-out-batch-${index}`, "sample"));
  }
  const report = buildOptOutBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
