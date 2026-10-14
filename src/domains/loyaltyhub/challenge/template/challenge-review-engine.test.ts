import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultChallengeReviewEngine } from "./challenge-review-engine.js";
import { newChallengeReview } from "./challenge-review.js";

test("ChallengeReviewEngine keeps results within bounds", () => {
  const engine = defaultChallengeReviewEngine();
  const item = newChallengeReview("code-86", "name-909");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
