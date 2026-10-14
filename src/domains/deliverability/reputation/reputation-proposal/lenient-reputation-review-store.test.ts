import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientReputationReviewStore } from "./lenient-reputation-review-store.js";
import { newLenientReputationReview } from "./lenient-reputation-review.js";

test("MemoryLenientReputationReviewStore finds what it saved", () => {
  const store = newMemoryLenientReputationReviewStore();
  const item = newLenientReputationReview("code-644", "label-993");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
