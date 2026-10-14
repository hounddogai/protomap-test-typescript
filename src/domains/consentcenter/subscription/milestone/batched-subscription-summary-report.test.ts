import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedSubscriptionSummaryReport } from "./batched-subscription-summary-report.js";
import { BatchedSubscriptionSummary, newBatchedSubscriptionSummary } from "./batched-subscription-summary.js";

test("BatchedSubscriptionSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_569_454);
  const items: BatchedSubscriptionSummary[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBatchedSubscriptionSummary(`batched-subscription-summary-${index}`, "sample"));
  }
  const report = buildBatchedSubscriptionSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
