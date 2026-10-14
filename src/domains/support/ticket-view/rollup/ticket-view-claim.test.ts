import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewClaim } from "./ticket-view-claim.js";

test("TicketViewClaim starts in created", () => {
  const item = newTicketViewClaim("code-846", "name-765");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewClaim moves to validated", () => {
  const item = newTicketViewClaim("code-846", "name-765");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TicketViewClaim rejects moves from retired", () => {
  const item = newTicketViewClaim("code-846", "name-765");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
