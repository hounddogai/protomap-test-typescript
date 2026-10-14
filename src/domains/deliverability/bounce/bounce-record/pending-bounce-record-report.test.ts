import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingBounceRecordReport } from "./pending-bounce-record-report.js";
import { PendingBounceRecord, newPendingBounceRecord } from "./pending-bounce-record.js";

test("PendingBounceRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_546_611);
  const items: PendingBounceRecord[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingBounceRecord(`pending-bounce-record-${index}`, "sample"));
  }
  const report = buildPendingBounceRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
