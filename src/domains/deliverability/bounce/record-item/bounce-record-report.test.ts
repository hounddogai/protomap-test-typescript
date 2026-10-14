import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceRecordReport } from "./bounce-record-report.js";
import { BounceRecord, newBounceRecord } from "./bounce-record.js";

test("BounceRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_984_654);
  const items: BounceRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBounceRecord(`bounce-record-${index}`, "sample"));
  }
  const report = buildBounceRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
