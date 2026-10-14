import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryPacingReviewEngine } from "./primary-pacing-review-engine.js";
import { newPrimaryPacingReview } from "./primary-pacing-review.js";

test("PrimaryPacingReviewEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPacingReviewEngine(flags.newRegistry());
  const item = newPrimaryPacingReview("code-134", "title-136");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
