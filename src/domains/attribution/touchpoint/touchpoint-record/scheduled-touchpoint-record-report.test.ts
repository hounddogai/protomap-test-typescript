import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledTouchpointRecordReport } from "./scheduled-touchpoint-record-report.js";
import { ScheduledTouchpointRecord, newScheduledTouchpointRecord } from "./scheduled-touchpoint-record.js";

test("ScheduledTouchpointRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_990_517);
  const items: ScheduledTouchpointRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledTouchpointRecord(`scheduled-touchpoint-record-${index}`, "sample"));
  }
  const report = buildScheduledTouchpointRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
