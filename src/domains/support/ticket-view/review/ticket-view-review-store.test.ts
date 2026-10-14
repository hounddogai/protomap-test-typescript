import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewReviewStore } from "./ticket-view-review-store.js";
import { newTicketViewReview } from "./ticket-view-review.js";

test("MemoryTicketViewReviewStore finds what it saved", () => {
  const store = newMemoryTicketViewReviewStore();
  const item = newTicketViewReview("code-389", "title-587");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
