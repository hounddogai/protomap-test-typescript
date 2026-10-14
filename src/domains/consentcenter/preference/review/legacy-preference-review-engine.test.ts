import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyPreferenceReviewEngine } from "./legacy-preference-review-engine.js";
import { newLegacyPreferenceReview } from "./legacy-preference-review.js";

test("LegacyPreferenceReviewEngine keeps results within bounds", () => {
  const engine = defaultLegacyPreferenceReviewEngine(flags.newRegistry());
  const item = newLegacyPreferenceReview("code-981", "name-500");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
