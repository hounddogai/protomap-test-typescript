import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedRedemptionReviewEngine } from "./batched-redemption-review-engine.js";
import { newBatchedRedemptionReview } from "./batched-redemption-review.js";

test("BatchedRedemptionReviewEngine keeps results within bounds", () => {
  const engine = defaultBatchedRedemptionReviewEngine();
  const item = newBatchedRedemptionReview("code-844", "name-495");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
