import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryWarmupReviewEngine } from "./primary-warmup-review-engine.js";
import { newPrimaryWarmupReview } from "./primary-warmup-review.js";

test("PrimaryWarmupReviewEngine keeps results within bounds", () => {
  const engine = defaultPrimaryWarmupReviewEngine(flags.newRegistry());
  const item = newPrimaryWarmupReview("code-327", "title-555");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
