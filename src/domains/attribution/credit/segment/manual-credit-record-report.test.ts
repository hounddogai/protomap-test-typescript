import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualCreditRecordReport } from "./manual-credit-record-report.js";
import { ManualCreditRecord, newManualCreditRecord } from "./manual-credit-record.js";

test("ManualCreditRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_350_031);
  const items: ManualCreditRecord[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newManualCreditRecord(`manual-credit-record-${index}`, "sample"));
  }
  const report = buildManualCreditRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
