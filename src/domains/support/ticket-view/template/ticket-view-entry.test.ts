import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewEntry } from "./ticket-view-entry.js";

test("TicketViewEntry starts in requested", () => {
  const item = newTicketViewEntry("code-74", "title-421");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewEntry moves to expired", () => {
  const item = newTicketViewEntry("code-74", "title-421");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("TicketViewEntry rejects moves from expired", () => {
  const item = newTicketViewEntry("code-74", "title-421");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
