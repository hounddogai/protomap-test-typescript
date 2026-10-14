import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewAudit } from "./ticket-view-audit.js";

test("TicketViewAudit starts in planned", () => {
  const item = newTicketViewAudit("code-551", "title-524");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewAudit moves to completed", () => {
  const item = newTicketViewAudit("code-551", "title-524");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("TicketViewAudit rejects moves from cancelled", () => {
  const item = newTicketViewAudit("code-551", "title-524");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
