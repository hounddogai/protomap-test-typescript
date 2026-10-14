import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingSuppressionRecordReport } from "./pending-suppression-record-report.js";
import { PendingSuppressionRecord, newPendingSuppressionRecord } from "./pending-suppression-record.js";

test("PendingSuppressionRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_478_360);
  const items: PendingSuppressionRecord[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPendingSuppressionRecord(`pending-suppression-record-${index}`, "sample"));
  }
  const report = buildPendingSuppressionRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
