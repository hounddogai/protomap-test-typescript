import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedFrequencyReviewEngine } from "./capped-frequency-review-engine.js";
import { newCappedFrequencyReview } from "./capped-frequency-review.js";

test("CappedFrequencyReviewEngine keeps results within bounds", () => {
  const engine = defaultCappedFrequencyReviewEngine(flags.newRegistry());
  const item = newCappedFrequencyReview("code-742", "label-724");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
