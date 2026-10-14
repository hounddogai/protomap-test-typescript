import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewReview } from "./ticket-view-review.js";

test("TicketViewReview starts in proposed", () => {
  const item = newTicketViewReview("code-389", "title-587");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewReview moves to withdrawn", () => {
  const item = newTicketViewReview("code-389", "title-587");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("TicketViewReview rejects moves from withdrawn", () => {
  const item = newTicketViewReview("code-389", "title-587");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
