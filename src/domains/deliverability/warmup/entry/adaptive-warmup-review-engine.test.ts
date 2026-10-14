import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveWarmupReviewEngine } from "./adaptive-warmup-review-engine.js";
import { newAdaptiveWarmupReview } from "./adaptive-warmup-review.js";

test("AdaptiveWarmupReviewEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveWarmupReviewEngine(flags.newRegistry());
  const item = newAdaptiveWarmupReview("code-22", "name-489");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
