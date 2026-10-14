import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRuleReviewReport } from "./reward-rule-review-report.js";
import { RewardRuleReview, newRewardRuleReview } from "./reward-rule-review.js";

test("RewardRuleReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_111_375);
  const items: RewardRuleReview[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRewardRuleReview(`reward-rule-review-${index}`, "sample"));
  }
  const report = buildRewardRuleReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
