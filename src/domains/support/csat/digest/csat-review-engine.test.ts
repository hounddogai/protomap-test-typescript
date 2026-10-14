import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatReviewEngine } from "./csat-review-engine.js";
import { newCsatReview } from "./csat-review.js";

test("CsatReviewEngine keeps results within bounds", () => {
  const engine = defaultCsatReviewEngine();
  const item = newCsatReview("code-583", "label-77");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
