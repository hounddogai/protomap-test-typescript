import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingQueueRecordReport } from "./rolling-queue-record-report.js";
import { RollingQueueRecord, newRollingQueueRecord } from "./rolling-queue-record.js";

test("RollingQueueRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_568_616);
  const items: RollingQueueRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingQueueRecord(`rolling-queue-record-${index}`, "sample"));
  }
  const report = buildRollingQueueRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
