import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveTicketViewLedger } from "./adaptive-ticket-view-ledger.js";

test("AdaptiveTicketViewLedger starts in open", () => {
  const item = newAdaptiveTicketViewLedger("code-30", "label-59");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveTicketViewLedger moves to archived", () => {
  const item = newAdaptiveTicketViewLedger("code-30", "label-59");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("AdaptiveTicketViewLedger rejects moves from archived", () => {
  const item = newAdaptiveTicketViewLedger("code-30", "label-59");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
