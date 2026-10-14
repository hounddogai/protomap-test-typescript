import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalInsightReviewStore } from "./global-insight-review-store.js";
import { newGlobalInsightReview } from "./global-insight-review.js";

test("MemoryGlobalInsightReviewStore finds what it saved", () => {
  const store = newMemoryGlobalInsightReviewStore();
  const item = newGlobalInsightReview("code-325", "label-365");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
