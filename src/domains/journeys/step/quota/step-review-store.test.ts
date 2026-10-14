import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepReviewStore } from "./step-review-store.js";
import { newStepReview } from "./step-review.js";

test("MemoryStepReviewStore finds what it saved", () => {
  const store = newMemoryStepReviewStore();
  const item = newStepReview("code-930", "label-873");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
