import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalSuppressionReviewEngine } from "./regional-suppression-review-engine.js";
import { newRegionalSuppressionReview } from "./regional-suppression-review.js";

test("RegionalSuppressionReviewEngine keeps results within bounds", () => {
  const engine = defaultRegionalSuppressionReviewEngine(flags.newRegistry());
  const item = newRegionalSuppressionReview("code-68", "name-964");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
