import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeReviewStore } from "./challenge-review-store.js";
import { newChallengeReview } from "./challenge-review.js";

test("MemoryChallengeReviewStore finds what it saved", () => {
  const store = newMemoryChallengeReviewStore();
  const item = newChallengeReview("code-86", "name-909");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
