import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyReviewStore } from "./journey-review-store.js";
import { newJourneyReview } from "./journey-review.js";

test("MemoryJourneyReviewStore finds what it saved", () => {
  const store = newMemoryJourneyReviewStore();
  const item = newJourneyReview("code-529", "title-930");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
