import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredTicketViewReviewStore } from "./tiered-ticket-view-review-store.js";
import { newTieredTicketViewReview } from "./tiered-ticket-view-review.js";

test("MemoryTieredTicketViewReviewStore finds what it saved", () => {
  const store = newMemoryTieredTicketViewReviewStore();
  const item = newTieredTicketViewReview("code-544", "label-719");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
