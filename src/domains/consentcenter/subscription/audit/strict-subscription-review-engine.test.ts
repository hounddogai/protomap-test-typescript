import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictSubscriptionReviewEngine } from "./strict-subscription-review-engine.js";
import { newStrictSubscriptionReview } from "./strict-subscription-review.js";

test("StrictSubscriptionReviewEngine keeps results within bounds", () => {
  const engine = defaultStrictSubscriptionReviewEngine(flags.newRegistry());
  const item = newStrictSubscriptionReview("code-374", "label-678");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
