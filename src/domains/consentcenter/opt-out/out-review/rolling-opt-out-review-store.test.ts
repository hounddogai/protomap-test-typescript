import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingOptOutReviewStore } from "./rolling-opt-out-review-store.js";
import { newRollingOptOutReview } from "./rolling-opt-out-review.js";

test("MemoryRollingOptOutReviewStore finds what it saved", () => {
  const store = newMemoryRollingOptOutReviewStore();
  const item = newRollingOptOutReview("code-156", "title-834");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
