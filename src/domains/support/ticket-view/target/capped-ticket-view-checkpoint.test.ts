import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedTicketViewCheckpoint } from "./capped-ticket-view-checkpoint.js";

test("CappedTicketViewCheckpoint starts in idle", () => {
  const item = newCappedTicketViewCheckpoint("code-151", "title-281");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedTicketViewCheckpoint moves to warming", () => {
  const item = newCappedTicketViewCheckpoint("code-151", "title-281");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CappedTicketViewCheckpoint rejects moves from stopped", () => {
  const item = newCappedTicketViewCheckpoint("code-151", "title-281");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
