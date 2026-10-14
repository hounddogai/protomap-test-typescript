import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedCreativeReviewEngine } from "./batched-creative-review-engine.js";
import { newBatchedCreativeReview } from "./batched-creative-review.js";

test("BatchedCreativeReviewEngine keeps results within bounds", () => {
  const engine = defaultBatchedCreativeReviewEngine();
  const item = newBatchedCreativeReview("code-358", "title-526");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
