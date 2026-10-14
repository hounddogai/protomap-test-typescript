import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroReviewEngine } from "./macro-review-engine.js";
import { newMacroReview } from "./macro-review.js";

test("MacroReviewEngine keeps results within bounds", () => {
  const engine = defaultMacroReviewEngine(flags.newRegistry());
  const item = newMacroReview("code-740", "label-499");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
