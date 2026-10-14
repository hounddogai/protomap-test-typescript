import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPostReviewEngine } from "./post-review-engine.js";
import { newPostReview } from "./post-review.js";

test("PostReviewEngine keeps results within bounds", () => {
  const engine = defaultPostReviewEngine();
  const item = newPostReview("code-398", "label-307");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
