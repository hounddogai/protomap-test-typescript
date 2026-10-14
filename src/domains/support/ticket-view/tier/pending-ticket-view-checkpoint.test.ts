import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingTicketViewCheckpoint } from "./pending-ticket-view-checkpoint.js";

test("PendingTicketViewCheckpoint starts in draft", () => {
  const item = newPendingTicketViewCheckpoint("code-913", "label-642");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingTicketViewCheckpoint moves to suspended", () => {
  const item = newPendingTicketViewCheckpoint("code-913", "label-642");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PendingTicketViewCheckpoint rejects moves from closed", () => {
  const item = newPendingTicketViewCheckpoint("code-913", "label-642");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
