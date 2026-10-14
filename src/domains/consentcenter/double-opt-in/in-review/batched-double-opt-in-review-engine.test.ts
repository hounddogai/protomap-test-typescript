import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedDoubleOptInReviewEngine } from "./batched-double-opt-in-review-engine.js";
import { newBatchedDoubleOptInReview } from "./batched-double-opt-in-review.js";

test("BatchedDoubleOptInReviewEngine keeps results within bounds", () => {
  const engine = defaultBatchedDoubleOptInReviewEngine();
  const item = newBatchedDoubleOptInReview("code-767", "name-221");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
