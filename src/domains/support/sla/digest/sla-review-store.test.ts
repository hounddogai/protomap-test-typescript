import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaReviewStore } from "./sla-review-store.js";
import { newSlaReview } from "./sla-review.js";

test("MemorySlaReviewStore finds what it saved", () => {
  const store = newMemorySlaReviewStore();
  const item = newSlaReview("code-159", "label-951");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
