import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingPostReviewEngine } from "./pending-post-review-engine.js";
import { newPendingPostReview } from "./pending-post-review.js";

test("PendingPostReviewEngine keeps results within bounds", () => {
  const engine = defaultPendingPostReviewEngine();
  const item = newPendingPostReview("code-188", "title-534");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
