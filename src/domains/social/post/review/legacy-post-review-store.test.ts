import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPostReviewStore } from "./legacy-post-review-store.js";
import { newLegacyPostReview } from "./legacy-post-review.js";

test("MemoryLegacyPostReviewStore finds what it saved", () => {
  const store = newMemoryLegacyPostReviewStore();
  const item = newLegacyPostReview("code-24", "title-950");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
