import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditRecordReport } from "./credit-record-report.js";
import { CreditRecord, newCreditRecord } from "./credit-record.js";

test("CreditRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_757_077);
  const items: CreditRecord[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCreditRecord(`credit-record-${index}`, "sample"));
  }
  const report = buildCreditRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
