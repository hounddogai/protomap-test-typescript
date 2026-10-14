import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedRewardReviewEngine } from "./batched-reward-review-engine.js";
import { newBatchedRewardReview } from "./batched-reward-review.js";

test("BatchedRewardReviewEngine keeps results within bounds", () => {
  const engine = defaultBatchedRewardReviewEngine();
  const item = newBatchedRewardReview("code-853", "label-769");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
