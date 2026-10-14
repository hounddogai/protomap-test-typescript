import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingEscalationSlot } from "./pending-escalation-slot.js";

test("PendingEscalationSlot starts in idle", () => {
  const item = newPendingEscalationSlot("code-971", "title-101");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingEscalationSlot moves to stopped", () => {
  const item = newPendingEscalationSlot("code-971", "title-101");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("PendingEscalationSlot rejects moves from stopped", () => {
  const item = newPendingEscalationSlot("code-971", "title-101");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
