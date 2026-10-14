import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedWindowReviewEngine } from "./weighted-window-review-engine.js";
import { newWeightedWindowReview } from "./weighted-window-review.js";

test("WeightedWindowReviewEngine keeps results within bounds", () => {
  const engine = defaultWeightedWindowReviewEngine(flags.newRegistry());
  const item = newWeightedWindowReview("code-680", "name-317");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
