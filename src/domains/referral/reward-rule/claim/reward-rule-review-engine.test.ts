import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardRuleReviewEngine } from "./reward-rule-review-engine.js";
import { newRewardRuleReview } from "./reward-rule-review.js";

test("RewardRuleReviewEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleReviewEngine();
  const item = newRewardRuleReview("code-950", "title-26");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
