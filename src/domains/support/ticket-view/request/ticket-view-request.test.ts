import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewRequest } from "./ticket-view-request.js";

test("TicketViewRequest starts in proposed", () => {
  const item = newTicketViewRequest("code-723", "label-723");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewRequest moves to approved", () => {
  const item = newTicketViewRequest("code-723", "label-723");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TicketViewRequest rejects moves from withdrawn", () => {
  const item = newTicketViewRequest("code-723", "label-723");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
