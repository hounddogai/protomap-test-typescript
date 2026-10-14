import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedBidRuleReviewEngine } from "./capped-bid-rule-review-engine.js";
import { newCappedBidRuleReview } from "./capped-bid-rule-review.js";

test("CappedBidRuleReviewEngine keeps results within bounds", () => {
  const engine = defaultCappedBidRuleReviewEngine();
  const item = newCappedBidRuleReview("code-314", "title-453");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
