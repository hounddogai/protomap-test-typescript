import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveSenderReviewEngine } from "./adaptive-sender-review-engine.js";
import { newAdaptiveSenderReview } from "./adaptive-sender-review.js";

test("AdaptiveSenderReviewEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveSenderReviewEngine();
  const item = newAdaptiveSenderReview("code-58", "label-762");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
