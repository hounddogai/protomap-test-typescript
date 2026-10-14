import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedJourneyReviewStore } from "./capped-journey-review-store.js";
import { newCappedJourneyReview } from "./capped-journey-review.js";

test("MemoryCappedJourneyReviewStore finds what it saved", () => {
  const store = newMemoryCappedJourneyReviewStore();
  const item = newCappedJourneyReview("code-97", "title-564");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
