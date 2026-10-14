import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortReviewStore } from "./cohort-review-store.js";
import { newCohortReview } from "./cohort-review.js";

test("MemoryCohortReviewStore finds what it saved", () => {
  const store = newMemoryCohortReviewStore();
  const item = newCohortReview("code-44", "name-968");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
