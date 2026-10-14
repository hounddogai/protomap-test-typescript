import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSubscriptionBatchReport } from "./subscription-batch-report.js";
import { SubscriptionBatch, newSubscriptionBatch } from "./subscription-batch.js";

test("SubscriptionBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_462_909);
  const items: SubscriptionBatch[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSubscriptionBatch(`subscription-batch-${index}`, "sample"));
  }
  const report = buildSubscriptionBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
