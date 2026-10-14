import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedStreakRecordReport } from "./batched-streak-record-report.js";
import { BatchedStreakRecord, newBatchedStreakRecord } from "./batched-streak-record.js";

test("BatchedStreakRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_123_778);
  const items: BatchedStreakRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBatchedStreakRecord(`batched-streak-record-${index}`, "sample"));
  }
  const report = buildBatchedStreakRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
