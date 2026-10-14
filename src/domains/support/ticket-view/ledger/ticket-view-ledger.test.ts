import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewLedger } from "./ticket-view-ledger.js";

test("TicketViewLedger starts in created", () => {
  const item = newTicketViewLedger("code-987", "name-334");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewLedger moves to published", () => {
  const item = newTicketViewLedger("code-987", "name-334");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TicketViewLedger rejects moves from retired", () => {
  const item = newTicketViewLedger("code-987", "name-334");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
