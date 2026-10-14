import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyReviewStore } from "./frequency-review-store.js";
import { newFrequencyReview } from "./frequency-review.js";

test("MemoryFrequencyReviewStore finds what it saved", () => {
  const store = newMemoryFrequencyReviewStore();
  const item = newFrequencyReview("code-41", "name-191");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
