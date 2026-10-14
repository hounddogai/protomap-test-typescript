import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalChallengeReviewStore } from "./regional-challenge-review-store.js";
import { newRegionalChallengeReview } from "./regional-challenge-review.js";

test("MemoryRegionalChallengeReviewStore finds what it saved", () => {
  const store = newMemoryRegionalChallengeReviewStore();
  const item = newRegionalChallengeReview("code-37", "title-88");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
