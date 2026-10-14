import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingCreativeReviewStore } from "./rolling-creative-review-store.js";
import { newRollingCreativeReview } from "./rolling-creative-review.js";

test("MemoryRollingCreativeReviewStore finds what it saved", () => {
  const store = newMemoryRollingCreativeReviewStore();
  const item = newRollingCreativeReview("code-882", "label-363");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
