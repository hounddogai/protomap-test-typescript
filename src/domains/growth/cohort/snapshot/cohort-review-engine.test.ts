import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCohortReviewEngine } from "./cohort-review-engine.js";
import { newCohortReview } from "./cohort-review.js";

test("CohortReviewEngine keeps results within bounds", () => {
  const engine = defaultCohortReviewEngine(flags.newRegistry());
  const item = newCohortReview("code-44", "name-968");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
