import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingNudgeReviewEngine } from "./rolling-nudge-review-engine.js";
import { newRollingNudgeReview } from "./rolling-nudge-review.js";

test("RollingNudgeReviewEngine keeps results within bounds", () => {
  const engine = defaultRollingNudgeReviewEngine();
  const item = newRollingNudgeReview("code-307", "label-70");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
