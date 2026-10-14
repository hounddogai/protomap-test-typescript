import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofReviewStore } from "./proof-review-store.js";
import { newProofReview } from "./proof-review.js";

test("MemoryProofReviewStore finds what it saved", () => {
  const store = newMemoryProofReviewStore();
  const item = newProofReview("code-93", "title-934");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
