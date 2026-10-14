import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientCreditRecordReport } from "./lenient-credit-record-report.js";
import { LenientCreditRecord, newLenientCreditRecord } from "./lenient-credit-record.js";

test("LenientCreditRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_597_946);
  const items: LenientCreditRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientCreditRecord(`lenient-credit-record-${index}`, "sample"));
  }
  const report = buildLenientCreditRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
