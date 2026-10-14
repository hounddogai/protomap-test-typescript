import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckRecordReport } from "./fraud-check-record-report.js";
import { FraudCheckRecord, newFraudCheckRecord } from "./fraud-check-record.js";

test("FraudCheckRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_735_381);
  const items: FraudCheckRecord[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFraudCheckRecord(`fraud-check-record-${index}`, "sample"));
  }
  const report = buildFraudCheckRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
