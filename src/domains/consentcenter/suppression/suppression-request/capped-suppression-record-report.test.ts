import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedSuppressionRecordReport } from "./capped-suppression-record-report.js";
import { CappedSuppressionRecord, newCappedSuppressionRecord } from "./capped-suppression-record.js";

test("CappedSuppressionRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_835_797);
  const items: CappedSuppressionRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedSuppressionRecord(`capped-suppression-record-${index}`, "sample"));
  }
  const report = buildCappedSuppressionRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
