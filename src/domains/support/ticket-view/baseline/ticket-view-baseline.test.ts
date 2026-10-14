import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewBaseline } from "./ticket-view-baseline.js";

test("TicketViewBaseline starts in requested", () => {
  const item = newTicketViewBaseline("code-638", "name-998");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewBaseline moves to revoked", () => {
  const item = newTicketViewBaseline("code-638", "name-998");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("TicketViewBaseline rejects moves from expired", () => {
  const item = newTicketViewBaseline("code-638", "name-998");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
