import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSubscriptionRecordReport } from "./subscription-record-report.js";
import { SubscriptionRecord, newSubscriptionRecord } from "./subscription-record.js";

test("SubscriptionRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_305_439);
  const items: SubscriptionRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSubscriptionRecord(`subscription-record-${index}`, "sample"));
  }
  const report = buildSubscriptionRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
