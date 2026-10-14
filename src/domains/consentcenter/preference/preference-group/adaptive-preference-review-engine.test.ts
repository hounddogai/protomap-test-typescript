import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptivePreferenceReviewEngine } from "./adaptive-preference-review-engine.js";
import { newAdaptivePreferenceReview } from "./adaptive-preference-review.js";

test("AdaptivePreferenceReviewEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePreferenceReviewEngine(flags.newRegistry());
  const item = newAdaptivePreferenceReview("code-144", "title-640");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
