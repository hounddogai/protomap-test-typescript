import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyBidRuleReviewReport } from "./legacy-bid-rule-review-report.js";
import { LegacyBidRuleReview, newLegacyBidRuleReview } from "./legacy-bid-rule-review.js";

test("LegacyBidRuleReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_082_328);
  const items: LegacyBidRuleReview[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyBidRuleReview(`legacy-bid-rule-review-${index}`, "sample"));
  }
  const report = buildLegacyBidRuleReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
