import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientWarmupReviewEngine } from "./lenient-warmup-review-engine.js";
import { newLenientWarmupReview } from "./lenient-warmup-review.js";

test("LenientWarmupReviewEngine keeps results within bounds", () => {
  const engine = defaultLenientWarmupReviewEngine(flags.newRegistry());
  const item = newLenientWarmupReview("code-662", "label-163");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
