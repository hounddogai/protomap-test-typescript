import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedBidRuleReviewReport } from "./capped-bid-rule-review-report.js";
import { CappedBidRuleReview, newCappedBidRuleReview } from "./capped-bid-rule-review.js";

test("CappedBidRuleReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_857_600);
  const items: CappedBidRuleReview[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedBidRuleReview(`capped-bid-rule-review-${index}`, "sample"));
  }
  const report = buildCappedBidRuleReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
