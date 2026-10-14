import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingPathRecordReport } from "./pending-path-record-report.js";
import { PendingPathRecord, newPendingPathRecord } from "./pending-path-record.js";

test("PendingPathRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_215_435);
  const items: PendingPathRecord[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingPathRecord(`pending-path-record-${index}`, "sample"));
  }
  const report = buildPendingPathRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
