import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPacingReviewStore } from "./regional-pacing-review-store.js";
import { newRegionalPacingReview } from "./regional-pacing-review.js";

test("MemoryRegionalPacingReviewStore finds what it saved", () => {
  const store = newMemoryRegionalPacingReviewStore();
  const item = newRegionalPacingReview("code-616", "name-719");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
