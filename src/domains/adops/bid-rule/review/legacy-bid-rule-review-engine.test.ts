import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyBidRuleReviewEngine } from "./legacy-bid-rule-review-engine.js";
import { newLegacyBidRuleReview } from "./legacy-bid-rule-review.js";

test("LegacyBidRuleReviewEngine keeps results within bounds", () => {
  const engine = defaultLegacyBidRuleReviewEngine();
  const item = newLegacyBidRuleReview("code-102", "label-128");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
