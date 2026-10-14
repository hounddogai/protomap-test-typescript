import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientTicketViewReview } from "./lenient-ticket-view-review.js";

test("LenientTicketViewReview starts in proposed", () => {
  const item = newLenientTicketViewReview("code-474", "name-910");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientTicketViewReview moves to approved", () => {
  const item = newLenientTicketViewReview("code-474", "name-910");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientTicketViewReview rejects moves from withdrawn", () => {
  const item = newLenientTicketViewReview("code-474", "name-910");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
