import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedSubscriptionRecordReport } from "./capped-subscription-record-report.js";
import { CappedSubscriptionRecord, newCappedSubscriptionRecord } from "./capped-subscription-record.js";

test("CappedSubscriptionRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_068_301);
  const items: CappedSubscriptionRecord[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedSubscriptionRecord(`capped-subscription-record-${index}`, "sample"));
  }
  const report = buildCappedSubscriptionRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
