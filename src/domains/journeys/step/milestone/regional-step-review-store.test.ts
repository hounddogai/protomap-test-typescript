import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalStepReviewStore } from "./regional-step-review-store.js";
import { newRegionalStepReview } from "./regional-step-review.js";

test("MemoryRegionalStepReviewStore finds what it saved", () => {
  const store = newMemoryRegionalStepReviewStore();
  const item = newRegionalStepReview("code-42", "name-352");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
