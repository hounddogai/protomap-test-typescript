import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictFrequencyReviewStore } from "./strict-frequency-review-store.js";
import { newStrictFrequencyReview } from "./strict-frequency-review.js";

test("MemoryStrictFrequencyReviewStore finds what it saved", () => {
  const store = newMemoryStrictFrequencyReviewStore();
  const item = newStrictFrequencyReview("code-920", "title-21");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
