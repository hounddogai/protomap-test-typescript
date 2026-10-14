import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreditReviewEngine } from "./credit-review-engine.js";
import { newCreditReview } from "./credit-review.js";

test("CreditReviewEngine keeps results within bounds", () => {
  const engine = defaultCreditReviewEngine();
  const item = newCreditReview("code-991", "label-799");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
