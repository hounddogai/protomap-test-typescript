import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledDeflectionRecordReport } from "./scheduled-deflection-record-report.js";
import { ScheduledDeflectionRecord, newScheduledDeflectionRecord } from "./scheduled-deflection-record.js";

test("ScheduledDeflectionRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_928_743);
  const items: ScheduledDeflectionRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledDeflectionRecord(`scheduled-deflection-record-${index}`, "sample"));
  }
  const report = buildScheduledDeflectionRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
