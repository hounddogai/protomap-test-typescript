import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalPacingReviewEngine } from "./regional-pacing-review-engine.js";
import { newRegionalPacingReview } from "./regional-pacing-review.js";

test("RegionalPacingReviewEngine keeps results within bounds", () => {
  const engine = defaultRegionalPacingReviewEngine(flags.newRegistry());
  const item = newRegionalPacingReview("code-616", "name-719");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
