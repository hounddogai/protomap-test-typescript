import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackJourneyReviewStore } from "./fallback-journey-review-store.js";
import { newFallbackJourneyReview } from "./fallback-journey-review.js";

test("MemoryFallbackJourneyReviewStore finds what it saved", () => {
  const store = newMemoryFallbackJourneyReviewStore();
  const item = newFallbackJourneyReview("code-616", "name-856");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
