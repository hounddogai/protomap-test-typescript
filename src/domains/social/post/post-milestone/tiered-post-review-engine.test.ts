import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredPostReviewEngine } from "./tiered-post-review-engine.js";
import { newTieredPostReview } from "./tiered-post-review.js";

test("TieredPostReviewEngine keeps results within bounds", () => {
  const engine = defaultTieredPostReviewEngine();
  const item = newTieredPostReview("code-65", "title-980");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
