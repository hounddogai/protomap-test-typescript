import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultProofReviewEngine } from "./proof-review-engine.js";
import { newProofReview } from "./proof-review.js";

test("ProofReviewEngine keeps results within bounds", () => {
  const engine = defaultProofReviewEngine();
  const item = newProofReview("code-93", "title-934");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
