import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredTicketViewReview } from "./tiered-ticket-view-review.js";

test("TieredTicketViewReview starts in proposed", () => {
  const item = newTieredTicketViewReview("code-544", "label-719");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredTicketViewReview moves to approved", () => {
  const item = newTieredTicketViewReview("code-544", "label-719");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TieredTicketViewReview rejects moves from withdrawn", () => {
  const item = newTieredTicketViewReview("code-544", "label-719");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
