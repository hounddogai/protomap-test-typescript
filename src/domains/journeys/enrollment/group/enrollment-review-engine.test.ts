import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnrollmentReviewEngine } from "./enrollment-review-engine.js";
import { newEnrollmentReview } from "./enrollment-review.js";

test("EnrollmentReviewEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentReviewEngine();
  const item = newEnrollmentReview("code-250", "name-594");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
