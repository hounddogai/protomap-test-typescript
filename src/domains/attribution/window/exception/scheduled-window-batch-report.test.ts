import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledWindowBatchReport } from "./scheduled-window-batch-report.js";
import { ScheduledWindowBatch, newScheduledWindowBatch } from "./scheduled-window-batch.js";

test("ScheduledWindowBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_470_609);
  const items: ScheduledWindowBatch[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledWindowBatch(`scheduled-window-batch-${index}`, "sample"));
  }
  const report = buildScheduledWindowBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
