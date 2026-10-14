import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualSlaReviewStore } from "./manual-sla-review-store.js";
import { newManualSlaReview } from "./manual-sla-review.js";

test("MemoryManualSlaReviewStore finds what it saved", () => {
  const store = newMemoryManualSlaReviewStore();
  const item = newManualSlaReview("code-10", "title-402");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
