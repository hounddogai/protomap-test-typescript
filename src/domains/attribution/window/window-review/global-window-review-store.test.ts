import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalWindowReviewStore } from "./global-window-review-store.js";
import { newGlobalWindowReview } from "./global-window-review.js";

test("MemoryGlobalWindowReviewStore finds what it saved", () => {
  const store = newMemoryGlobalWindowReviewStore();
  const item = newGlobalWindowReview("code-516", "name-786");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
