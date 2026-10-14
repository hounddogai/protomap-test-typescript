import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredTicketViewAdjustment } from "./tiered-ticket-view-adjustment.js";

test("TieredTicketViewAdjustment starts in new", () => {
  const item = newTieredTicketViewAdjustment("code-512", "title-923");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredTicketViewAdjustment moves to done", () => {
  const item = newTieredTicketViewAdjustment("code-512", "title-923");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("TieredTicketViewAdjustment rejects moves from failed", () => {
  const item = newTieredTicketViewAdjustment("code-512", "title-923");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
