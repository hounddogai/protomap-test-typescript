import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryTicketViewReviewStore } from "./primary-ticket-view-review-store.js";
import { newPrimaryTicketViewReview } from "./primary-ticket-view-review.js";

test("MemoryPrimaryTicketViewReviewStore finds what it saved", () => {
  const store = newMemoryPrimaryTicketViewReviewStore();
  const item = newPrimaryTicketViewReview("code-747", "label-148");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
