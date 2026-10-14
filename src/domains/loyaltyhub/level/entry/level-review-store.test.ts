import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelReviewStore } from "./level-review-store.js";
import { newLevelReview } from "./level-review.js";

test("MemoryLevelReviewStore finds what it saved", () => {
  const store = newMemoryLevelReviewStore();
  const item = newLevelReview("code-157", "label-118");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
