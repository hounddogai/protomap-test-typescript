import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedDeflectionReviewEngine } from "./batched-deflection-review-engine.js";
import { newBatchedDeflectionReview } from "./batched-deflection-review.js";

test("BatchedDeflectionReviewEngine keeps results within bounds", () => {
  const engine = defaultBatchedDeflectionReviewEngine();
  const item = newBatchedDeflectionReview("code-418", "label-297");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
