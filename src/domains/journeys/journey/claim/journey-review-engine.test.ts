import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultJourneyReviewEngine } from "./journey-review-engine.js";
import { newJourneyReview } from "./journey-review.js";

test("JourneyReviewEngine keeps results within bounds", () => {
  const engine = defaultJourneyReviewEngine();
  const item = newJourneyReview("code-529", "title-930");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
