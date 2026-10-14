import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedEnrollmentReviewEngine } from "./capped-enrollment-review-engine.js";
import { newCappedEnrollmentReview } from "./capped-enrollment-review.js";

test("CappedEnrollmentReviewEngine keeps results within bounds", () => {
  const engine = defaultCappedEnrollmentReviewEngine(flags.newRegistry());
  const item = newCappedEnrollmentReview("code-497", "title-35");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
