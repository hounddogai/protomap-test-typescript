import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackRewardReviewEngine } from "./fallback-reward-review-engine.js";
import { newFallbackRewardReview } from "./fallback-reward-review.js";

test("FallbackRewardReviewEngine keeps results within bounds", () => {
  const engine = defaultFallbackRewardReviewEngine(flags.newRegistry());
  const item = newFallbackRewardReview("code-296", "name-142");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
