import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalTicketViewLedger } from "./regional-ticket-view-ledger.js";

test("RegionalTicketViewLedger starts in open", () => {
  const item = newRegionalTicketViewLedger("code-187", "label-814");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalTicketViewLedger moves to reopened", () => {
  const item = newRegionalTicketViewLedger("code-187", "label-814");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RegionalTicketViewLedger rejects moves from archived", () => {
  const item = newRegionalTicketViewLedger("code-187", "label-814");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
