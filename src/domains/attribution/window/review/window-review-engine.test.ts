import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowReviewEngine } from "./window-review-engine.js";
import { newWindowReview } from "./window-review.js";

test("WindowReviewEngine keeps results within bounds", () => {
  const engine = defaultWindowReviewEngine();
  const item = newWindowReview("code-804", "name-233");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
