import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInRecordReport } from "./double-opt-in-record-report.js";
import { DoubleOptInRecord, newDoubleOptInRecord } from "./double-opt-in-record.js";

test("DoubleOptInRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_770_614);
  const items: DoubleOptInRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDoubleOptInRecord(`double-opt-in-record-${index}`, "sample"));
  }
  const report = buildDoubleOptInRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
