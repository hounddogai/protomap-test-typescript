import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleReviewEngine } from "./bid-rule-review-engine.js";
import { newBidRuleReview } from "./bid-rule-review.js";

test("BidRuleReviewEngine keeps results within bounds", () => {
  const engine = defaultBidRuleReviewEngine();
  const item = newBidRuleReview("code-480", "title-134");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
