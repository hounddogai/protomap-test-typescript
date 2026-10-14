import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientTicketViewReviewStore } from "./lenient-ticket-view-review-store.js";
import { newLenientTicketViewReview } from "./lenient-ticket-view-review.js";

test("MemoryLenientTicketViewReviewStore finds what it saved", () => {
  const store = newMemoryLenientTicketViewReviewStore();
  const item = newLenientTicketViewReview("code-474", "name-910");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
