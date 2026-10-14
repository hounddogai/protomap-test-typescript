import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewBundle } from "./ticket-view-bundle.js";

test("TicketViewBundle starts in new", () => {
  const item = newTicketViewBundle("code-78", "name-800");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewBundle moves to queued", () => {
  const item = newTicketViewBundle("code-78", "name-800");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TicketViewBundle rejects moves from failed", () => {
  const item = newTicketViewBundle("code-78", "name-800");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
