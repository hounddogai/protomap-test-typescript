import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackChallengeReviewEngine } from "./fallback-challenge-review-engine.js";
import { newFallbackChallengeReview } from "./fallback-challenge-review.js";

test("FallbackChallengeReviewEngine keeps results within bounds", () => {
  const engine = defaultFallbackChallengeReviewEngine(flags.newRegistry());
  const item = newFallbackChallengeReview("code-473", "label-379");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
