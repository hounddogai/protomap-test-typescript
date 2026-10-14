import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedRewardReviewEngine } from "./weighted-reward-review-engine.js";
import { newWeightedRewardReview } from "./weighted-reward-review.js";

test("WeightedRewardReviewEngine keeps results within bounds", () => {
  const engine = defaultWeightedRewardReviewEngine();
  const item = newWeightedRewardReview("code-910", "title-525");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
