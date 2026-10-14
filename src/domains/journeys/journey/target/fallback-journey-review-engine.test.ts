import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackJourneyReviewEngine } from "./fallback-journey-review-engine.js";
import { newFallbackJourneyReview } from "./fallback-journey-review.js";

test("FallbackJourneyReviewEngine keeps results within bounds", () => {
  const engine = defaultFallbackJourneyReviewEngine();
  const item = newFallbackJourneyReview("code-616", "name-856");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
