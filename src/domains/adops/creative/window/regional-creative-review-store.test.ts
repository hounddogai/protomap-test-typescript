import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalCreativeReviewStore } from "./regional-creative-review-store.js";
import { newRegionalCreativeReview } from "./regional-creative-review.js";

test("MemoryRegionalCreativeReviewStore finds what it saved", () => {
  const store = newMemoryRegionalCreativeReviewStore();
  const item = newRegionalCreativeReview("code-225", "title-226");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
