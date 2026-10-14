import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedBidRuleSummaryReport } from "./batched-bid-rule-summary-report.js";
import { BatchedBidRuleSummary, newBatchedBidRuleSummary } from "./batched-bid-rule-summary.js";

test("BatchedBidRuleSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_829_185);
  const items: BatchedBidRuleSummary[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedBidRuleSummary(`batched-bid-rule-summary-${index}`, "sample"));
  }
  const report = buildBatchedBidRuleSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
