import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedActivationReviewEngine } from "./weighted-activation-review-engine.js";
import { newWeightedActivationReview } from "./weighted-activation-review.js";

test("WeightedActivationReviewEngine keeps results within bounds", () => {
  const engine = defaultWeightedActivationReviewEngine(flags.newRegistry());
  const item = newWeightedActivationReview("code-588", "name-93");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
