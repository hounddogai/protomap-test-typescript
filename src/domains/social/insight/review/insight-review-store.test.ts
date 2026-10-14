import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightReviewStore } from "./insight-review-store.js";
import { newInsightReview } from "./insight-review.js";

test("MemoryInsightReviewStore finds what it saved", () => {
  const store = newMemoryInsightReviewStore();
  const item = newInsightReview("code-626", "title-213");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
