import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryTicketViewReview } from "./primary-ticket-view-review.js";

test("PrimaryTicketViewReview starts in requested", () => {
  const item = newPrimaryTicketViewReview("code-747", "label-148");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryTicketViewReview moves to granted", () => {
  const item = newPrimaryTicketViewReview("code-747", "label-148");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimaryTicketViewReview rejects moves from expired", () => {
  const item = newPrimaryTicketViewReview("code-747", "label-148");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
