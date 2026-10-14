import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewBudget } from "./ticket-view-budget.js";

test("TicketViewBudget starts in requested", () => {
  const item = newTicketViewBudget("code-350", "title-906");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewBudget moves to revoked", () => {
  const item = newTicketViewBudget("code-350", "title-906");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("TicketViewBudget rejects moves from expired", () => {
  const item = newTicketViewBudget("code-350", "title-906");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
