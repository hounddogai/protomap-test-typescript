import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionRecordReport } from "./redemption-record-report.js";
import { RedemptionRecord, newRedemptionRecord } from "./redemption-record.js";

test("RedemptionRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_815_093);
  const items: RedemptionRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRedemptionRecord(`redemption-record-${index}`, "sample"));
  }
  const report = buildRedemptionRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
